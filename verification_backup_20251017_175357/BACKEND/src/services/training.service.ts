import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
import path from 'path';
import fs from 'fs-extra';
import { query } from '../database/connection';
import { logger } from '../middleware/logger';

export interface TrainingConfig {
  modelType: string;
  datasetId: string;
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  optimizer?: 'adam' | 'sgd' | 'rmsprop' | 'adagrad';
  lossFunction?: string;
}

export interface TrainingMetrics {
  epoch: number;
  step: number;
  totalSteps: number;
  loss: number;
  accuracy?: number;
  valLoss?: number;
  valAccuracy?: number;
  learningRate?: number;
}

export interface TrainingJob {
  id: string;
  userId: string;
  modelId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  config: TrainingConfig;
  metrics?: TrainingMetrics;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export class TrainingService extends EventEmitter {
  private activeJobs = new Map<string, tf.LayersModel>();

  /**
   * Create a new training job
   */
  async createTrainingJob(
    userId: string,
    modelId: string,
    config: TrainingConfig
  ): Promise<string> {
    try {
      // Validate dataset exists
      const dataset = await query(
        'SELECT id, file_path FROM datasets WHERE id = $1',
        [config.datasetId]
      );

      if (dataset.rows.length === 0) {
        throw new Error(`Dataset not found: ${config.datasetId}`);
      }

      // Create training job in database
      const result = await query(
        `INSERT INTO training_jobs (user_id, model_id, status, config, created_at)
         VALUES ($1, $2, 'queued', $3, NOW())
         RETURNING id`,
        [userId, modelId, JSON.stringify(config)]
      );

      const jobId = result.rows[0].id;

      logger.info({
        msg: 'training_job_created',
        jobId,
        userId,
        modelId,
        config
      });

      // Start training in background
      this.executeTraining(jobId, userId, config, dataset.rows[0].file_path)
        .catch(error => {
          logger.error({
            msg: 'training_execution_error',
            jobId,
            error: error.message
          });
        });

      return jobId;
    } catch (error: any) {
      logger.error({
        msg: 'create_training_job_failed',
        userId,
        modelId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute training
   */
  private async executeTraining(
    jobId: string,
    userId: string,
    config: TrainingConfig,
    datasetPath: string
  ): Promise<void> {
    try {
      // Update status to running
      await query(
        `UPDATE training_jobs 
         SET status = 'running', started_at = NOW()
         WHERE id = $1`,
        [jobId]
      );

      // Load dataset
      const { xs, ys, inputShape, numClasses } = await this.loadDataset(datasetPath);

      // Create model
      const model = this.createModel(
        inputShape,
        numClasses,
        config.modelType
      );

      this.activeJobs.set(jobId, model);

      // Compile model
      model.compile({
        optimizer: this.getOptimizer(config.optimizer || 'adam', config.learningRate),
        loss: config.lossFunction || 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      logger.info({
        msg: 'training_started',
        jobId,
        modelSummary: {
          inputShape,
          numClasses,
          totalParams: model.countParams()
        }
      });

      // Train model
      const history = await model.fit(xs, ys, {
        epochs: config.epochs,
        batchSize: config.batchSize,
        validationSplit: config.validationSplit,
        callbacks: {
          onEpochBegin: async (epoch) => {
            logger.debug({
              msg: 'epoch_started',
              jobId,
              epoch: epoch + 1,
              totalEpochs: config.epochs
            });
          },
          onEpochEnd: async (epoch, logs) => {
            const progress = Math.floor(((epoch + 1) / config.epochs) * 100);
            
            const metrics: TrainingMetrics = {
              epoch: epoch + 1,
              step: epoch + 1,
              totalSteps: config.epochs,
              loss: logs?.loss || 0,
              accuracy: logs?.acc,
              valLoss: logs?.val_loss,
              valAccuracy: logs?.val_acc,
              learningRate: config.learningRate
            };

            // Update progress in database
            await query(
              `UPDATE training_jobs 
               SET progress = $1, metrics = $2
               WHERE id = $3`,
              [progress, JSON.stringify(metrics), jobId]
            );

            // Emit progress event
            this.emit('progress', {
              jobId,
              epoch: epoch + 1,
              totalEpochs: config.epochs,
              progress,
              metrics
            });

            logger.info({
              msg: 'epoch_completed',
              jobId,
              epoch: epoch + 1,
              metrics
            });

            // Save checkpoint every 5 epochs
            if ((epoch + 1) % 5 === 0) {
              await this.saveCheckpoint(jobId, epoch + 1, model, metrics);
            }
          },
          onBatchEnd: async (batch, logs) => {
            // Periodic batch logging
            if (batch % 10 === 0) {
              logger.debug({
                msg: 'batch_completed',
                jobId,
                batch,
                loss: logs?.loss
              });
            }
          }
        }
      });

      // Save final model
      const modelPath = path.join(
        process.cwd(),
        'models',
        'trained',
        `job_${jobId}`
      );
      
      await fs.ensureDir(modelPath);
      await model.save(`file://${modelPath}`);

      // Update job as completed
      const finalMetrics = {
        epoch: config.epochs,
        step: config.epochs,
        totalSteps: config.epochs,
        loss: history.history.loss[history.history.loss.length - 1] as number,
        accuracy: history.history.acc 
          ? history.history.acc[history.history.acc.length - 1] as number 
          : undefined,
        valLoss: history.history.val_loss 
          ? history.history.val_loss[history.history.val_loss.length - 1] as number
          : undefined,
        valAccuracy: history.history.val_acc 
          ? history.history.val_acc[history.history.val_acc.length - 1] as number
          : undefined
      };

      await query(
        `UPDATE training_jobs 
         SET status = 'completed', 
             progress = 100, 
             metrics = $1,
             completed_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(finalMetrics), jobId]
      );

      // Update model with trained path
      await query(
        `UPDATE models 
         SET file_path = $1, 
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{trained}',
               'true'::jsonb
             )
         WHERE id = (SELECT model_id FROM training_jobs WHERE id = $2)`,
        [modelPath, jobId]
      );

      // Cleanup
      xs.dispose();
      ys.dispose();
      this.activeJobs.delete(jobId);

      this.emit('completed', {
        jobId,
        metrics: finalMetrics,
        modelPath
      });

      logger.info({
        msg: 'training_completed',
        jobId,
        finalMetrics,
        modelPath
      });

    } catch (error: any) {
      // Mark as failed
      await query(
        `UPDATE training_jobs 
         SET status = 'failed', 
             error_message = $1, 
             completed_at = NOW()
         WHERE id = $2`,
        [error.message, jobId]
      );

      this.activeJobs.delete(jobId);

      this.emit('failed', {
        jobId,
        error: error.message
      });

      logger.error({
        msg: 'training_failed',
        jobId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Create a model based on type
   */
  private createModel(
    inputShape: number[],
    numClasses: number,
    modelType: string
  ): tf.LayersModel {
    const model = tf.sequential();

    if (modelType === 'simple') {
      // Simple feedforward network
      model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        inputShape: inputShape
      }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
    } else if (modelType === 'cnn') {
      // Convolutional network for sequences
      model.add(tf.layers.conv1d({
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
        inputShape: inputShape
      }));
      model.add(tf.layers.maxPooling1d({ poolSize: 2 }));
      model.add(tf.layers.conv1d({ filters: 64, kernelSize: 3, activation: 'relu' }));
      model.add(tf.layers.maxPooling1d({ poolSize: 2 }));
      model.add(tf.layers.flatten());
      model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
      model.add(tf.layers.dropout({ rate: 0.5 }));
      model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
    } else if (modelType === 'lstm') {
      // LSTM for sequence data
      model.add(tf.layers.lstm({
        units: 128,
        returnSequences: true,
        inputShape: inputShape
      }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.lstm({ units: 64 }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
    } else {
      // Default: simple dense network
      model.add(tf.layers.dense({
        units: 256,
        activation: 'relu',
        inputShape: inputShape
      }));
      model.add(tf.layers.batchNormalization());
      model.add(tf.layers.dropout({ rate: 0.3 }));
      model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
      model.add(tf.layers.batchNormalization());
      model.add(tf.layers.dropout({ rate: 0.3 }));
      model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
    }

    return model;
  }

  /**
   * Get optimizer
   */
  private getOptimizer(type: string, learningRate: number): tf.Optimizer {
    switch (type) {
      case 'sgd':
        return tf.train.sgd(learningRate);
      case 'rmsprop':
        return tf.train.rmsprop(learningRate);
      case 'adam':
      default:
        return tf.train.adam(learningRate);
    }
  }

  /**
   * Load dataset from file
   */
  private async loadDataset(datasetPath: string): Promise<{
    xs: tf.Tensor;
    ys: tf.Tensor;
    inputShape: number[];
    numClasses: number;
  }> {
    // For demonstration, generate synthetic data
    // In production, parse the actual dataset file
    const numSamples = 1000;
    const inputDim = 10;
    const numClasses = 5;

    const xsData: number[][] = [];
    const ysData: number[][] = [];

    for (let i = 0; i < numSamples; i++) {
      // Generate random input
      const x: number[] = Array(inputDim).fill(0).map(() => Math.random());
      xsData.push(x);

      // Generate random one-hot label
      const label = Math.floor(Math.random() * numClasses);
      const y: number[] = Array(numClasses).fill(0);
      y[label] = 1;
      ysData.push(y);
    }

    const xs = tf.tensor2d(xsData);
    const ys = tf.tensor2d(ysData);

    return {
      xs,
      ys,
      inputShape: [inputDim],
      numClasses
    };
  }

  /**
   * Save checkpoint
   */
  private async saveCheckpoint(
    jobId: string,
    epoch: number,
    model: tf.LayersModel,
    metrics: TrainingMetrics
  ): Promise<void> {
    try {
      const checkpointPath = path.join(
        process.cwd(),
        'models',
        'checkpoints',
        `job_${jobId}`,
        `epoch_${epoch}`
      );

      await fs.ensureDir(checkpointPath);
      await model.save(`file://${checkpointPath}`);

      await query(
        `INSERT INTO checkpoints (training_job_id, epoch, step, loss, accuracy, file_path, metadata)
         VALUES (
           (SELECT id FROM training_jobs WHERE id = $1),
           $2, $3, $4, $5, $6, $7
         )`,
        [
          jobId,
          epoch,
          metrics.step,
          metrics.loss,
          metrics.accuracy || null,
          checkpointPath,
          JSON.stringify({ valLoss: metrics.valLoss, valAccuracy: metrics.valAccuracy })
        ]
      );

      logger.info({
        msg: 'checkpoint_saved',
        jobId,
        epoch,
        path: checkpointPath
      });
    } catch (error: any) {
      logger.error({
        msg: 'checkpoint_save_failed',
        jobId,
        epoch,
        error: error.message
      });
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<TrainingJob | null> {
    try {
      const result = await query(
        `SELECT 
          id,
          user_id as "userId",
          model_id as "modelId",
          status,
          progress,
          config,
          metrics,
          error_message as "errorMessage",
          started_at as "startedAt",
          completed_at as "completedAt",
          created_at as "createdAt"
         FROM training_jobs
         WHERE id = $1`,
        [jobId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const job = result.rows[0];
      return {
        ...job,
        config: typeof job.config === 'string' ? JSON.parse(job.config) : job.config,
        metrics: job.metrics && typeof job.metrics === 'string' 
          ? JSON.parse(job.metrics) 
          : job.metrics
      };
    } catch (error: any) {
      logger.error({
        msg: 'get_job_status_failed',
        jobId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string): Promise<TrainingJob[]> {
    try {
      const result = await query(
        `SELECT 
          id,
          user_id as "userId",
          model_id as "modelId",
          status,
          progress,
          config,
          metrics,
          error_message as "errorMessage",
          started_at as "startedAt",
          completed_at as "completedAt",
          created_at as "createdAt"
         FROM training_jobs
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map(job => ({
        ...job,
        config: typeof job.config === 'string' ? JSON.parse(job.config) : job.config,
        metrics: job.metrics && typeof job.metrics === 'string' 
          ? JSON.parse(job.metrics) 
          : job.metrics
      }));
    } catch (error: any) {
      logger.error({
        msg: 'get_user_jobs_failed',
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancel a training job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const model = this.activeJobs.get(jobId);
      
      if (model) {
        // Stop training by disposing model
        model.dispose();
        this.activeJobs.delete(jobId);
      }

      const result = await query(
        `UPDATE training_jobs 
         SET status = 'cancelled', 
             error_message = 'Cancelled by user', 
             completed_at = NOW()
         WHERE id = $1 AND status IN ('queued', 'running')
         RETURNING id`,
        [jobId]
      );

      if (result.rowCount && result.rowCount > 0) {
        this.emit('cancelled', { jobId });
        
        logger.info({
          msg: 'training_cancelled',
          jobId
        });

        return true;
      }

      return false;
    } catch (error: any) {
      logger.error({
        msg: 'cancel_job_failed',
        jobId,
        error: error.message
      });
      throw error;
    }
  }
}

// Export singleton instance
export const trainingService = new TrainingService();
