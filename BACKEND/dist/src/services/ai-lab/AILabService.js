"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AILabService = void 0;
const tf = __importStar(require("@tensorflow/tfjs-node-gpu"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const logger_1 = require("../../config/logger");
const websocket_service_1 = require("../websocket.service");
const ModelArchitectureFactory_1 = require("./ModelArchitectureFactory");
const DatasetService_1 = require("./DatasetService");
class AILabService {
    constructor() {
        this.trainingJobs = new Map();
        this.settings = new Map();
        this.storageBasePath = path_1.default.join(process.cwd(), 'storage', 'ai-lab');
        this.initializeStorage();
        this.detectGPU();
    }
    async initializeStorage() {
        await fs_extra_1.default.ensureDir(path_1.default.join(this.storageBasePath, 'models'));
        await fs_extra_1.default.ensureDir(path_1.default.join(this.storageBasePath, 'datasets'));
        await fs_extra_1.default.ensureDir(path_1.default.join(this.storageBasePath, 'checkpoints'));
        await fs_extra_1.default.ensureDir(path_1.default.join(this.storageBasePath, 'logs'));
    }
    detectGPU() {
        try {
            const backend = tf.getBackend();
            logger_1.logger.info(`TensorFlow.js backend: ${backend}`);
            if (backend === 'tensorflow') {
                logger_1.logger.info('GPU acceleration is available and enabled');
            }
            else {
                logger_1.logger.warn('GPU acceleration not available, using CPU backend');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to detect GPU:', error);
        }
    }
    async startTraining(config) {
        const jobId = (0, uuid_1.v4)();
        const io = (0, websocket_service_1.getSocketIOInstance)();
        try {
            // Create training job
            const job = {
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
                logger_1.logger.error(`Training job ${jobId} failed:`, error);
                job.status = 'failed';
                job.error = error.message;
                io.to(`user:${config.userId}`).emit('training:error', {
                    jobId,
                    error: error.message
                });
            });
            return jobId;
        }
        catch (error) {
            logger_1.logger.error('Failed to start training:', error);
            throw error;
        }
    }
    async runTraining(jobId, config) {
        const job = this.trainingJobs.get(jobId);
        if (!job)
            throw new Error('Job not found');
        const io = (0, websocket_service_1.getSocketIOInstance)();
        const datasetService = new DatasetService_1.DatasetService();
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
            const model = await ModelArchitectureFactory_1.ModelArchitectureFactory.createModel(config.architecture, config.modelType, {
                layers: config.layers,
                inputShape: trainData.inputShape,
                outputShape: trainData.outputShape
            });
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
                loss: history.history.loss[history.history.loss.length - 1],
                accuracy: (history.history.acc?.[history.history.acc.length - 1] || 0),
                validationLoss: (history.history.val_loss?.[history.history.val_loss.length - 1] || 0),
                validationAccuracy: (history.history.val_acc?.[history.history.val_acc.length - 1] || 0)
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
        }
        catch (error) {
            logger_1.logger.error(`Training failed for job ${jobId}:`, error);
            job.status = 'failed';
            job.error = error.message;
            throw error;
        }
    }
    async prepareData(dataset) {
        // This is a simplified example - in real implementation, 
        // this would handle different data types and preprocessing
        const data = dataset.data;
        const splitIndex = Math.floor(data.length * 0.8);
        const trainData = data.slice(0, splitIndex);
        const validationData = data.slice(splitIndex);
        // Convert to tensors (simplified example)
        const trainXs = tf.tensor2d(trainData.map((d) => d.features));
        const trainYs = tf.tensor2d(trainData.map((d) => d.labels));
        const valXs = tf.tensor2d(validationData.map((d) => d.features));
        const valYs = tf.tensor2d(validationData.map((d) => d.labels));
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
    async saveCheckpoint(jobId, model, epoch) {
        const checkpointPath = path_1.default.join(this.storageBasePath, 'checkpoints', jobId, `epoch-${epoch}`);
        await fs_extra_1.default.ensureDir(checkpointPath);
        await model.save(`file://${checkpointPath}`);
        logger_1.logger.info(`Checkpoint saved for job ${jobId} at epoch ${epoch}`);
    }
    async saveModel(jobId, model, config) {
        const modelPath = path_1.default.join(this.storageBasePath, 'models', config.userId, `${config.modelName}-${jobId}`);
        await fs_extra_1.default.ensureDir(modelPath);
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
        await fs_extra_1.default.writeJson(path_1.default.join(modelPath, 'metadata.json'), metadata, { spaces: 2 });
        logger_1.logger.info(`Model saved for job ${jobId} at ${modelPath}`);
        return modelPath;
    }
    async getTrainingStatus(jobId) {
        const job = this.trainingJobs.get(jobId);
        if (!job)
            return null;
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
    async updateSettings(userId, settings) {
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
                await fs_extra_1.default.ensureDir(settings.baseDirectory);
                // Update storage paths
                this.storageBasePath = settings.baseDirectory;
                await this.initializeStorage();
            }
            catch (error) {
                throw new Error('Invalid base directory');
            }
        }
        this.settings.set(userId, updatedSettings);
        // Save settings to disk
        const settingsPath = path_1.default.join(this.storageBasePath, 'settings', `${userId}.json`);
        await fs_extra_1.default.ensureDir(path_1.default.dirname(settingsPath));
        await fs_extra_1.default.writeJson(settingsPath, updatedSettings, { spaces: 2 });
        return updatedSettings;
    }
    async getSettings(userId) {
        let settings = this.settings.get(userId);
        if (!settings) {
            // Try to load from disk
            const settingsPath = path_1.default.join(this.storageBasePath, 'settings', `${userId}.json`);
            if (await fs_extra_1.default.pathExists(settingsPath)) {
                settings = await fs_extra_1.default.readJson(settingsPath);
                if (settings) {
                    this.settings.set(userId, settings);
                }
            }
            else {
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
        return settings;
    }
}
exports.AILabService = AILabService;
//# sourceMappingURL=AILabService.js.map