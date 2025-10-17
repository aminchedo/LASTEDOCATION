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
exports.trainingService = exports.TrainingService = void 0;
const events_1 = require("events");
const tf = __importStar(require("@tensorflow/tfjs-node"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const connection_1 = require("../database/connection");
const logger_1 = require("../middleware/logger");
class TrainingService extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.activeJobs = new Map();
    }
    /**
     * Create a new training job
     */
    async createTrainingJob(userId, modelId, config) {
        try {
            // Validate dataset exists
            const dataset = await (0, connection_1.query)('SELECT id, file_path FROM datasets WHERE id = $1', [config.datasetId]);
            if (dataset.rows.length === 0) {
                throw new Error(`Dataset not found: ${config.datasetId}`);
            }
            // Create training job in database
            const result = await (0, connection_1.query)(`INSERT INTO training_jobs (user_id, model_id, status, config, created_at)
         VALUES ($1, $2, 'queued', $3, NOW())
         RETURNING id`, [userId, modelId, JSON.stringify(config)]);
            const jobId = result.rows[0].id;
            logger_1.logger.info({
                msg: 'training_job_created',
                jobId,
                userId,
                modelId,
                config
            });
            // Start training in background
            this.executeTraining(jobId, userId, config, dataset.rows[0].file_path)
                .catch(error => {
                logger_1.logger.error({
                    msg: 'training_execution_error',
                    jobId,
                    error: error.message
                });
            });
            return jobId;
        }
        catch (error) {
            logger_1.logger.error({
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
    async executeTraining(jobId, userId, config, datasetPath) {
        try {
            // Update status to running
            await (0, connection_1.query)(`UPDATE training_jobs 
         SET status = 'running', started_at = NOW()
         WHERE id = $1`, [jobId]);
            // Load dataset
            const { xs, ys, inputShape, numClasses } = await this.loadDataset(datasetPath);
            // Create model
            const model = this.createModel(inputShape, numClasses, config.modelType);
            this.activeJobs.set(jobId, model);
            // Compile model
            model.compile({
                optimizer: this.getOptimizer(config.optimizer || 'adam', config.learningRate),
                loss: config.lossFunction || 'categoricalCrossentropy',
                metrics: ['accuracy']
            });
            logger_1.logger.info({
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
                        logger_1.logger.debug({
                            msg: 'epoch_started',
                            jobId,
                            epoch: epoch + 1,
                            totalEpochs: config.epochs
                        });
                    },
                    onEpochEnd: async (epoch, logs) => {
                        const progress = Math.floor(((epoch + 1) / config.epochs) * 100);
                        const metrics = {
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
                        await (0, connection_1.query)(`UPDATE training_jobs 
               SET progress = $1, metrics = $2
               WHERE id = $3`, [progress, JSON.stringify(metrics), jobId]);
                        // Emit progress event
                        this.emit('progress', {
                            jobId,
                            epoch: epoch + 1,
                            totalEpochs: config.epochs,
                            progress,
                            metrics
                        });
                        logger_1.logger.info({
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
                            logger_1.logger.debug({
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
            const modelPath = path_1.default.join(process.cwd(), 'models', 'trained', `job_${jobId}`);
            await fs_extra_1.default.ensureDir(modelPath);
            await model.save(`file://${modelPath}`);
            // Update job as completed
            const finalMetrics = {
                epoch: config.epochs,
                step: config.epochs,
                totalSteps: config.epochs,
                loss: history.history.loss[history.history.loss.length - 1],
                accuracy: history.history.acc
                    ? history.history.acc[history.history.acc.length - 1]
                    : undefined,
                valLoss: history.history.val_loss
                    ? history.history.val_loss[history.history.val_loss.length - 1]
                    : undefined,
                valAccuracy: history.history.val_acc
                    ? history.history.val_acc[history.history.val_acc.length - 1]
                    : undefined
            };
            await (0, connection_1.query)(`UPDATE training_jobs 
         SET status = 'completed', 
             progress = 100, 
             metrics = $1,
             completed_at = NOW()
         WHERE id = $2`, [JSON.stringify(finalMetrics), jobId]);
            // Update model with trained path
            await (0, connection_1.query)(`UPDATE models 
         SET file_path = $1, 
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{trained}',
               'true'::jsonb
             )
         WHERE id = (SELECT model_id FROM training_jobs WHERE id = $2)`, [modelPath, jobId]);
            // Cleanup
            xs.dispose();
            ys.dispose();
            this.activeJobs.delete(jobId);
            this.emit('completed', {
                jobId,
                metrics: finalMetrics,
                modelPath
            });
            logger_1.logger.info({
                msg: 'training_completed',
                jobId,
                finalMetrics,
                modelPath
            });
        }
        catch (error) {
            // Mark as failed
            await (0, connection_1.query)(`UPDATE training_jobs 
         SET status = 'failed', 
             error_message = $1, 
             completed_at = NOW()
         WHERE id = $2`, [error.message, jobId]);
            this.activeJobs.delete(jobId);
            this.emit('failed', {
                jobId,
                error: error.message
            });
            logger_1.logger.error({
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
    createModel(inputShape, numClasses, modelType) {
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
        }
        else if (modelType === 'cnn') {
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
        }
        else if (modelType === 'lstm') {
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
        }
        else {
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
    getOptimizer(type, learningRate) {
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
    async loadDataset(datasetPath) {
        // For demonstration, generate synthetic data
        // In production, parse the actual dataset file
        const numSamples = 1000;
        const inputDim = 10;
        const numClasses = 5;
        const xsData = [];
        const ysData = [];
        for (let i = 0; i < numSamples; i++) {
            // Generate random input
            const x = Array(inputDim).fill(0).map(() => Math.random());
            xsData.push(x);
            // Generate random one-hot label
            const label = Math.floor(Math.random() * numClasses);
            const y = Array(numClasses).fill(0);
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
    async saveCheckpoint(jobId, epoch, model, metrics) {
        try {
            const checkpointPath = path_1.default.join(process.cwd(), 'models', 'checkpoints', `job_${jobId}`, `epoch_${epoch}`);
            await fs_extra_1.default.ensureDir(checkpointPath);
            await model.save(`file://${checkpointPath}`);
            await (0, connection_1.query)(`INSERT INTO checkpoints (training_job_id, epoch, step, loss, accuracy, file_path, metadata)
         VALUES (
           (SELECT id FROM training_jobs WHERE id = $1),
           $2, $3, $4, $5, $6, $7
         )`, [
                jobId,
                epoch,
                metrics.step,
                metrics.loss,
                metrics.accuracy || null,
                checkpointPath,
                JSON.stringify({ valLoss: metrics.valLoss, valAccuracy: metrics.valAccuracy })
            ]);
            logger_1.logger.info({
                msg: 'checkpoint_saved',
                jobId,
                epoch,
                path: checkpointPath
            });
        }
        catch (error) {
            logger_1.logger.error({
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
    async getJobStatus(jobId) {
        try {
            const result = await (0, connection_1.query)(`SELECT 
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
         WHERE id = $1`, [jobId]);
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
        }
        catch (error) {
            logger_1.logger.error({
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
    async getUserJobs(userId) {
        try {
            const result = await (0, connection_1.query)(`SELECT 
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
         ORDER BY created_at DESC`, [userId]);
            return result.rows.map(job => ({
                ...job,
                config: typeof job.config === 'string' ? JSON.parse(job.config) : job.config,
                metrics: job.metrics && typeof job.metrics === 'string'
                    ? JSON.parse(job.metrics)
                    : job.metrics
            }));
        }
        catch (error) {
            logger_1.logger.error({
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
    async cancelJob(jobId) {
        try {
            const model = this.activeJobs.get(jobId);
            if (model) {
                // Stop training by disposing model
                model.dispose();
                this.activeJobs.delete(jobId);
            }
            const result = await (0, connection_1.query)(`UPDATE training_jobs 
         SET status = 'cancelled', 
             error_message = 'Cancelled by user', 
             completed_at = NOW()
         WHERE id = $1 AND status IN ('queued', 'running')
         RETURNING id`, [jobId]);
            if (result.rowCount && result.rowCount > 0) {
                this.emit('cancelled', { jobId });
                logger_1.logger.info({
                    msg: 'training_cancelled',
                    jobId
                });
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'cancel_job_failed',
                jobId,
                error: error.message
            });
            throw error;
        }
    }
}
exports.TrainingService = TrainingService;
// Export singleton instance
exports.trainingService = new TrainingService();
//# sourceMappingURL=training.service.js.map