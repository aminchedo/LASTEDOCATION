import * as tf from '@tensorflow/tfjs-node-gpu';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import { logger } from '../../config/logger';
import { getSocketIOInstance } from '../websocket.service';
import { TrainingJob, TrainingStatus, AILabSettings } from '../../types/ai-lab';
import { ModelArchitectureFactory } from './ModelArchitectureFactory';
import { DatasetService } from './DatasetService';

export class AILabService {
  private trainingJobs: Map<string, TrainingJob> = new Map();
  private storageBasePath: string;
  private settings: Map<string, AILabSettings> = new Map();

  constructor() {
    this.storageBasePath = path.join(process.cwd(), 'storage', 'ai-lab');
    this.initializeStorage();
    this.detectGPU();
  }

  private async initializeStorage() {
    await fs.ensureDir(path.join(this.storageBasePath, 'models'));
    await fs.ensureDir(path.join(this.storageBasePath, 'datasets'));
    await fs.ensureDir(path.join(this.storageBasePath, 'checkpoints'));
    await fs.ensureDir(path.join(this.storageBasePath, 'logs'));
  }

  private detectGPU() {
    try {
      const backend = tf.getBackend();
      logger.info(`TensorFlow.js backend: ${backend}`);
      
      if (backend === 'tensorflow') {
        logger.info('GPU acceleration is available and enabled');
      } else {
        logger.warn('GPU acceleration not available, using CPU backend');
      }
    } catch (error) {
      logger.error('Failed to detect GPU:', error);
    }
  }

  async startTraining(config: any): Promise<string> {
    const jobId = uuidv4();
    const io = getSocketIOInstance();
    
    try {
      // Create training job
      const job: TrainingJob = {
        id: jobId,
        userId: config.userId,
        modelName: config.modelName,
        modelType: config.modelType,
        architecture: config.architecture,
        status: 'initializing',
        progress: 0,
        startTime: new Date(),
        config,
        metrics: {
          loss: [],
          accuracy: [],
          validationLoss: [],
          validationAccuracy: []
        }
      };

      this.trainingJobs.set(jobId, job);

      // Emit training start event
      io.to(`user:${config.userId}`).emit('training:start', {
        jobId,
        modelName: config.modelName
      });

      // Start training in background
      this.runTraining(jobId, config).catch(error => {
        logger.error(`Training job ${jobId} failed:`, error);
        job.status = 'failed';
        job.error = error.message;
        
        io.to(`user:${config.userId}`).emit('training:error', {
          jobId,
          error: error.message
        });
      });

      return jobId;
    } catch (error: any) {
      logger.error('Failed to start training:', error);
      throw error;
    }
  }

  private async runTraining(jobId: string, config: any) {
    const job = this.trainingJobs.get(jobId);
    if (!job) throw new Error('Job not found');

    const io = getSocketIOInstance();
    const datasetService = new DatasetService();

    try {
      // Update status
      job.status = 'loading_data';
      io.to(`user:${config.userId}`).emit('training:progress', {
        jobId,
        status: 'loading_data',
        progress: 5
      });

      // Load dataset
      const dataset = await datasetService.loadDataset(config.datasetId);
      if (!dataset) {
        throw new Error('Dataset not found');
      }

      // Prepare data
      job.status = 'preparing_data';
      io.to(`user:${config.userId}`).emit('training:progress', {
        jobId,
        status: 'preparing_data',
        progress: 10
      });

      const { trainData, validationData } = await this.prepareData(dataset);

      // Create model
      job.status = 'creating_model';
      io.to(`user:${config.userId}`).emit('training:progress', {
        jobId,
        status: 'creating_model',
        progress: 15
      });

      const model = await ModelArchitectureFactory.createModel(
        config.architecture,
        config.modelType,
        {
          layers: config.layers,
          inputShape: trainData.inputShape,
          outputShape: trainData.outputShape
        }
      );

      // Compile model
      model.compile({
        optimizer: config.parameters.optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Training configuration
      const epochs = config.parameters.epochs;
      const batchSize = config.parameters.batchSize;
      let currentEpoch = 0;

      // Start training
      job.status = 'training';
      const history = await model.fit(trainData.xs, trainData.ys, {
        epochs,
        batchSize,
        validationData: [validationData.xs, validationData.ys],
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            currentEpoch = epoch + 1;
            const progress = Math.round((currentEpoch / epochs) * 100);
            
            // Update metrics
            if (logs) {
              job.metrics.loss.push(logs.loss);
              job.metrics.accuracy.push(logs.acc || 0);
              job.metrics.validationLoss.push(logs.val_loss || 0);
              job.metrics.validationAccuracy.push(logs.val_acc || 0);
            }

            // Update job progress
            job.progress = progress;
            job.currentEpoch = currentEpoch;
            job.totalEpochs = epochs;

            // Emit progress update
            io.to(`user:${config.userId}`).emit('training:progress', {
              jobId,
              status: 'training',
              progress,
              epoch: currentEpoch,
              totalEpochs: epochs,
              metrics: {
                loss: logs?.loss,
                accuracy: logs?.acc,
                validationLoss: logs?.val_loss,
                validationAccuracy: logs?.val_acc
              }
            });

            // Save checkpoint every 10 epochs
            if (currentEpoch % 10 === 0) {
              await this.saveCheckpoint(jobId, model, currentEpoch);
            }
          },
          onBatchEnd: async (batch, logs) => {
            // Emit batch progress for real-time updates
            if (batch % 10 === 0) {
              io.to(`user:${config.userId}`).emit('training:batch', {
                jobId,
                batch,
                loss: logs?.loss,
                accuracy: logs?.acc
              });
            }
          }
        }
      });

      // Save final model
      job.status = 'saving_model';
      io.to(`user:${config.userId}`).emit('training:progress', {
        jobId,
        status: 'saving_model',
        progress: 95
      });

      const modelPath = await this.saveModel(jobId, model, config);
      
      // Update job completion
      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date();
      job.modelPath = modelPath;
      job.finalMetrics = {
        loss: history.history.loss[history.history.loss.length - 1] as number,
        accuracy: (history.history.acc?.[history.history.acc.length - 1] || 0) as number,
        validationLoss: (history.history.val_loss?.[history.history.val_loss.length - 1] || 0) as number,
        validationAccuracy: (history.history.val_acc?.[history.history.val_acc.length - 1] || 0) as number
      };

      // Emit completion
      io.to(`user:${config.userId}`).emit('training:complete', {
        jobId,
        modelPath,
        metrics: job.finalMetrics
      });

      // Clean up tensors
      trainData.xs.dispose();
      trainData.ys.dispose();
      validationData.xs.dispose();
      validationData.ys.dispose();

    } catch (error: any) {
      logger.error(`Training failed for job ${jobId}:`, error);
      job.status = 'failed';
      job.error = error.message;
      throw error;
    }
  }

  private async prepareData(dataset: any) {
    // This is a simplified example - in real implementation, 
    // this would handle different data types and preprocessing
    const data = dataset.data;
    const splitIndex = Math.floor(data.length * 0.8);
    
    const trainData = data.slice(0, splitIndex);
    const validationData = data.slice(splitIndex);

    // Convert to tensors (simplified example)
    const trainXs = tf.tensor2d(trainData.map((d: any) => d.features));
    const trainYs = tf.tensor2d(trainData.map((d: any) => d.labels));
    
    const valXs = tf.tensor2d(validationData.map((d: any) => d.features));
    const valYs = tf.tensor2d(validationData.map((d: any) => d.labels));

    return {
      trainData: {
        xs: trainXs,
        ys: trainYs,
        inputShape: trainXs.shape.slice(1),
        outputShape: trainYs.shape.slice(1)
      },
      validationData: {
        xs: valXs,
        ys: valYs
      }
    };
  }

  private async saveCheckpoint(jobId: string, model: tf.LayersModel, epoch: number) {
    const checkpointPath = path.join(
      this.storageBasePath,
      'checkpoints',
      jobId,
      `epoch-${epoch}`
    );
    
    await fs.ensureDir(checkpointPath);
    await model.save(`file://${checkpointPath}`);
    
    logger.info(`Checkpoint saved for job ${jobId} at epoch ${epoch}`);
  }

  private async saveModel(jobId: string, model: tf.LayersModel, config: any) {
    const modelPath = path.join(
      this.storageBasePath,
      'models',
      config.userId,
      `${config.modelName}-${jobId}`
    );
    
    await fs.ensureDir(modelPath);
    
    // Save model
    await model.save(`file://${modelPath}`);
    
    // Save metadata
    const metadata = {
      jobId,
      modelName: config.modelName,
      modelType: config.modelType,
      architecture: config.architecture,
      parameters: config.parameters,
      createdAt: new Date(),
      inputShape: model.inputs[0].shape,
      outputShape: model.outputs[0].shape
    };
    
    await fs.writeJson(path.join(modelPath, 'metadata.json'), metadata, { spaces: 2 });
    
    logger.info(`Model saved for job ${jobId} at ${modelPath}`);
    return modelPath;
  }

  async getTrainingStatus(jobId: string): Promise<TrainingStatus | null> {
    const job = this.trainingJobs.get(jobId);
    if (!job) return null;

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      currentEpoch: job.currentEpoch,
      totalEpochs: job.totalEpochs,
      metrics: job.metrics,
      startTime: job.startTime,
      endTime: job.endTime,
      error: job.error
    };
  }

  async updateSettings(userId: string, settings: Partial<AILabSettings>): Promise<AILabSettings> {
    const currentSettings = this.settings.get(userId) || {
      userId,
      baseDirectory: this.storageBasePath,
      gpuEnabled: tf.getBackend() === 'tensorflow',
      maxConcurrentJobs: 2,
      autoSaveCheckpoints: true,
      checkpointInterval: 10
    };

    const updatedSettings = { ...currentSettings, ...settings };
    
    // Validate base directory if changed
    if (settings.baseDirectory && settings.baseDirectory !== currentSettings.baseDirectory) {
      try {
        await fs.ensureDir(settings.baseDirectory);
        // Update storage paths
        this.storageBasePath = settings.baseDirectory;
        await this.initializeStorage();
      } catch (error) {
        throw new Error('Invalid base directory');
      }
    }

    this.settings.set(userId, updatedSettings);
    
    // Save settings to disk
    const settingsPath = path.join(this.storageBasePath, 'settings', `${userId}.json`);
    await fs.ensureDir(path.dirname(settingsPath));
    await fs.writeJson(settingsPath, updatedSettings, { spaces: 2 });

    return updatedSettings;
  }

  async getSettings(userId: string): Promise<AILabSettings> {
    let settings = this.settings.get(userId);
    
    if (!settings) {
      // Try to load from disk
      const settingsPath = path.join(this.storageBasePath, 'settings', `${userId}.json`);
      if (await fs.pathExists(settingsPath)) {
        settings = await fs.readJson(settingsPath);
        if (settings) {
          this.settings.set(userId, settings);
        }
      } else {
        // Return default settings
        settings = {
          userId,
          baseDirectory: this.storageBasePath,
          gpuEnabled: tf.getBackend() === 'tensorflow',
          maxConcurrentJobs: 2,
          autoSaveCheckpoints: true,
          checkpointInterval: 10
        };
      }
    }

    return settings!;
  }
}