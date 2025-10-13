"use strict";
/**
 * Offline Training API Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const offlineTraining_1 = require("../services/offlineTraining");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../middleware/logger");
const router = express_1.default.Router();
// Validation schemas
const trainingConfigSchema = zod_1.z.object({
    // Model Configuration
    modelType: zod_1.z.enum(['llm', 'stt', 'tts', 'embedding', 'classification']),
    architecture: zod_1.z.string().min(1).max(100),
    hiddenSize: zod_1.z.number().min(1).max(10000),
    numLayers: zod_1.z.number().min(1).max(100),
    numHeads: zod_1.z.number().min(1).max(100),
    vocabSize: zod_1.z.number().min(1).max(1000000),
    // Training Configuration
    epochs: zod_1.z.number().min(1).max(1000),
    batchSize: zod_1.z.number().min(1).max(1000),
    learningRate: zod_1.z.number().min(0.0001).max(1),
    weightDecay: zod_1.z.number().min(0).max(1),
    warmupSteps: zod_1.z.number().min(0).max(10000),
    maxSteps: zod_1.z.number().min(1).max(1000000).optional(),
    gradientAccumulationSteps: zod_1.z.number().min(1).max(100),
    maxGradNorm: zod_1.z.number().min(0.1).max(10),
    // Data Configuration
    trainSplit: zod_1.z.number().min(0.1).max(0.9),
    valSplit: zod_1.z.number().min(0.05).max(0.3),
    testSplit: zod_1.z.number().min(0.05).max(0.3),
    maxSequenceLength: zod_1.z.number().min(1).max(10000),
    dataAugmentation: zod_1.z.boolean(),
    // Optimization
    optimizer: zod_1.z.enum(['adam', 'adamw', 'sgd', 'rmsprop']),
    scheduler: zod_1.z.enum(['linear', 'cosine', 'constant', 'polynomial']),
    mixedPrecision: zod_1.z.boolean(),
    gradientCheckpointing: zod_1.z.boolean(),
    // Hardware
    useGPU: zod_1.z.boolean(),
    numGPUs: zod_1.z.number().min(0).max(8),
    cpuOnly: zod_1.z.boolean(),
    // Output
    outputDir: zod_1.z.string().optional(),
    saveSteps: zod_1.z.number().min(100).max(10000),
    evalSteps: zod_1.z.number().min(100).max(10000),
    loggingSteps: zod_1.z.number().min(10).max(1000),
    saveTotalLimit: zod_1.z.number().min(1).max(10)
});
const createTrainingJobSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    datasetId: zod_1.z.string().min(1),
    baseModelId: zod_1.z.string().optional(),
    config: trainingConfigSchema
});
// Get all training jobs
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const jobs = offlineTraining_1.offlineTrainingService.getAllTrainingJobs();
        res.json({
            success: true,
            data: jobs,
            meta: {
                total: jobs.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_training_jobs_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve training jobs',
            message: error.message
        });
    }
});
// Get training job by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const job = offlineTraining_1.offlineTrainingService.getTrainingJob(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Training job not found',
                message: `Training job with ID ${id} does not exist`
            });
        }
        return res.json({
            success: true,
            data: job,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_training_job_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve training job',
            message: error.message
        });
    }
});
// Create new training job
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const validation = createTrainingJobSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Invalid training job configuration',
                details: validation.error.flatten()
            });
        }
        const { name, datasetId, baseModelId, config } = validation.data;
        const processedConfig = {
            ...config,
            outputDir: config.outputDir || path_1.default.join(process.cwd(), 'data', 'training', `job_${Date.now()}`)
        };
        const job = await offlineTraining_1.offlineTrainingService.createTrainingJob(name, datasetId, processedConfig, baseModelId);
        return res.status(201).json({
            success: true,
            data: job,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'create_training_job_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to create training job',
            message: error.message
        });
    }
});
// Start training
router.post('/:id/start', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const success = await offlineTraining_1.offlineTrainingService.startTraining(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Training job not found',
                message: `Training job with ID ${id} does not exist`
            });
        }
        return res.json({
            success: true,
            message: 'Training started successfully',
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'start_training_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to start training',
            message: error.message
        });
    }
});
// Pause training
router.post('/:id/pause', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const success = offlineTraining_1.offlineTrainingService.pauseTraining(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Training job not found or not running',
                message: `Training job with ID ${id} does not exist or is not currently running`
            });
        }
        return res.json({
            success: true,
            message: 'Training paused successfully',
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'pause_training_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to pause training',
            message: error.message
        });
    }
});
// Resume training
router.post('/:id/resume', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const success = offlineTraining_1.offlineTrainingService.resumeTraining(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Training job not found or not paused',
                message: `Training job with ID ${id} does not exist or is not currently paused`
            });
        }
        return res.json({
            success: true,
            message: 'Training resumed successfully',
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'resume_training_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to resume training',
            message: error.message
        });
    }
});
// Cancel training
router.post('/:id/cancel', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const success = offlineTraining_1.offlineTrainingService.cancelTraining(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Training job not found or already completed',
                message: `Training job with ID ${id} does not exist or is already completed`
            });
        }
        return res.json({
            success: true,
            message: 'Training cancelled successfully',
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'cancel_training_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to cancel training',
            message: error.message
        });
    }
});
// Delete training job
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const success = offlineTraining_1.offlineTrainingService.deleteTrainingJob(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Training job not found',
                message: `Training job with ID ${id} does not exist`
            });
        }
        return res.json({
            success: true,
            message: 'Training job deleted successfully',
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'delete_training_job_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to delete training job',
            message: error.message
        });
    }
});
// Get training logs
router.get('/:id/logs', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const job = offlineTraining_1.offlineTrainingService.getTrainingJob(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Training job not found',
                message: `Training job with ID ${id} does not exist`
            });
        }
        return res.json({
            success: true,
            data: {
                logs: job.logs,
                totalLogs: job.logs.length
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_training_logs_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve training logs',
            message: error.message
        });
    }
});
// Get training metrics
router.get('/:id/metrics', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const job = offlineTraining_1.offlineTrainingService.getTrainingJob(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Training job not found',
                message: `Training job with ID ${id} does not exist`
            });
        }
        return res.json({
            success: true,
            data: {
                metrics: job.metrics,
                progress: job.progress
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_training_metrics_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve training metrics',
            message: error.message
        });
    }
});
// Get training statistics
router.get('/stats/overview', auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = offlineTraining_1.offlineTrainingService.getStats();
        return res.json({
            success: true,
            data: stats,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_training_stats_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve training statistics',
            message: error.message
        });
    }
});
// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            service: 'offline-training',
            timestamp: new Date().toISOString()
        }
    });
});
exports.default = router;
//# sourceMappingURL=offlineTraining.js.map