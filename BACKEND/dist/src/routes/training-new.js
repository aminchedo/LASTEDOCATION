"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Training API Routes - Real TensorFlow.js training with database
 */
const express_1 = require("express");
const zod_1 = require("zod");
const logger_1 = require("../middleware/logger");
const training_service_1 = require("../services/training.service");
const router = (0, express_1.Router)();
// Validation schema for training config
const trainingConfigSchema = zod_1.z.object({
    datasetId: zod_1.z.string().min(1, 'Dataset ID is required'),
    epochs: zod_1.z.number().int().min(1).max(1000),
    batchSize: zod_1.z.number().int().min(1).max(1024),
    learningRate: zod_1.z.number().min(0.00001).max(1),
    modelType: zod_1.z.enum(['simple', 'complex', 'custom']).optional().default('simple'),
    validationSplit: zod_1.z.number().min(0).max(0.5).optional().default(0.2),
    optimizer: zod_1.z.enum(['adam', 'sgd', 'rmsprop']).optional().default('adam')
});
/**
 * Create new training job
 * POST /api/training
 * Body: TrainingConfig
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id || 'default';
        // Validate config with zod
        const validationResult = trainingConfigSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.format()
            });
            return;
        }
        const config = validationResult.data;
        logger_1.logger.info({
            msg: 'creating_training_job',
            userId,
            config
        });
        const jobId = await training_service_1.trainingService.createTrainingJob(userId, 'default-model', // TODO: Get from config
        config);
        res.json({
            success: true,
            data: {
                trainingId: jobId,
                message: 'Training job created successfully'
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'create_training_job_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get training job status
 * GET /api/training/:jobId
 */
router.get('/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await training_service_1.trainingService.getJobStatus(jobId);
        if (!job) {
            res.status(404).json({
                success: false,
                error: 'Training job not found'
            });
            return;
        }
        res.json({
            success: true,
            data: job
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_job_status_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get all training jobs for user
 * GET /api/training
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id || 'default';
        const jobs = await training_service_1.trainingService.getUserJobs(userId);
        res.json({
            success: true,
            data: jobs,
            total: jobs.length
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_user_jobs_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Cancel training job
 * DELETE /api/training/:jobId
 */
router.delete('/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const cancelled = await training_service_1.trainingService.cancelJob(jobId);
        if (!cancelled) {
            res.status(404).json({
                success: false,
                error: 'Training job not found or already completed'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Training job cancelled successfully'
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'cancel_job_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Listen to training events and emit via WebSocket
training_service_1.trainingService.on('progress', (data) => {
    logger_1.logger.info({ msg: 'training_progress', ...data });
    // TODO: Emit via WebSocket
});
training_service_1.trainingService.on('completed', (data) => {
    logger_1.logger.info({ msg: 'training_completed', ...data });
    // TODO: Emit via WebSocket
});
training_service_1.trainingService.on('failed', (data) => {
    logger_1.logger.error({ msg: 'training_failed', ...data });
    // TODO: Emit via WebSocket
});
exports.default = router;
//# sourceMappingURL=training-new.js.map