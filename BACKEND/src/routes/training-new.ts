/**
 * Training API Routes - Real TensorFlow.js training with database
 */
import { Router, Request, Response } from 'express';
import { logger } from '../middleware/logger';
import { trainingService, TrainingConfig } from '../services/training.service';

const router = Router();

/**
 * Create new training job
 * POST /api/training
 * Body: TrainingConfig
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'default';
    const config: TrainingConfig = req.body;

    // Validate config
    if (!config.datasetId || !config.epochs || !config.batchSize || !config.learningRate) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: datasetId, epochs, batchSize, learningRate'
      });
      return;
    }

    // Set defaults
    config.modelType = config.modelType || 'simple';
    config.validationSplit = config.validationSplit || 0.2;
    config.optimizer = config.optimizer || 'adam';

    logger.info({
      msg: 'creating_training_job',
      userId,
      config
    });

    const jobId = await trainingService.createTrainingJob(
      userId,
      'default-model', // TODO: Get from config
      config
    );

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Training job created successfully'
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'create_training_job_failed', error: error.message });
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
router.get('/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await trainingService.getJobStatus(jobId);

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
  } catch (error: any) {
    logger.error({ msg: 'get_job_status_failed', error: error.message });
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
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'default';

    const jobs = await trainingService.getUserJobs(userId);

    res.json({
      success: true,
      data: jobs,
      total: jobs.length
    });
  } catch (error: any) {
    logger.error({ msg: 'get_user_jobs_failed', error: error.message });
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
router.delete('/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const cancelled = await trainingService.cancelJob(jobId);

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
  } catch (error: any) {
    logger.error({ msg: 'cancel_job_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Listen to training events and emit via WebSocket
trainingService.on('progress', (data) => {
  logger.info({ msg: 'training_progress', ...data });
  // TODO: Emit via WebSocket
});

trainingService.on('completed', (data) => {
  logger.info({ msg: 'training_completed', ...data });
  // TODO: Emit via WebSocket
});

trainingService.on('failed', (data) => {
  logger.error({ msg: 'training_failed', ...data });
  // TODO: Emit via WebSocket
});

export default router;
