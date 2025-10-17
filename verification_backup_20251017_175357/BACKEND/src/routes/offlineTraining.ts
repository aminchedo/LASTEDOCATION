/**
 * Offline Training API Routes
 */

import express from 'express';
import path from 'path';
import { z } from 'zod';
import { offlineTrainingService, TrainingJob, TrainingConfig } from '../services/offlineTraining';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../middleware/logger';

const router = express.Router();

// Validation schemas
const trainingConfigSchema = z.object({
  // Model Configuration
  modelType: z.enum(['llm', 'stt', 'tts', 'embedding', 'classification']),
  architecture: z.string().min(1).max(100),
  hiddenSize: z.number().min(1).max(10000),
  numLayers: z.number().min(1).max(100),
  numHeads: z.number().min(1).max(100),
  vocabSize: z.number().min(1).max(1000000),

  // Training Configuration
  epochs: z.number().min(1).max(1000),
  batchSize: z.number().min(1).max(1000),
  learningRate: z.number().min(0.0001).max(1),
  weightDecay: z.number().min(0).max(1),
  warmupSteps: z.number().min(0).max(10000),
  maxSteps: z.number().min(1).max(1000000).optional(),
  gradientAccumulationSteps: z.number().min(1).max(100),
  maxGradNorm: z.number().min(0.1).max(10),

  // Data Configuration
  trainSplit: z.number().min(0.1).max(0.9),
  valSplit: z.number().min(0.05).max(0.3),
  testSplit: z.number().min(0.05).max(0.3),
  maxSequenceLength: z.number().min(1).max(10000),
  dataAugmentation: z.boolean(),

  // Optimization
  optimizer: z.enum(['adam', 'adamw', 'sgd', 'rmsprop']),
  scheduler: z.enum(['linear', 'cosine', 'constant', 'polynomial']),
  mixedPrecision: z.boolean(),
  gradientCheckpointing: z.boolean(),

  // Hardware
  useGPU: z.boolean(),
  numGPUs: z.number().min(0).max(8),
  cpuOnly: z.boolean(),

  // Output
  outputDir: z.string().optional(),
  saveSteps: z.number().min(100).max(10000),
  evalSteps: z.number().min(100).max(10000),
  loggingSteps: z.number().min(10).max(1000),
  saveTotalLimit: z.number().min(1).max(10)
});

const createTrainingJobSchema = z.object({
  name: z.string().min(1).max(100),
  datasetId: z.string().min(1),
  baseModelId: z.string().optional(),
  config: trainingConfigSchema
});

// Get all training jobs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobs = offlineTrainingService.getAllTrainingJobs();

    res.json({
      success: true,
      data: jobs,
      meta: {
        total: jobs.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'get_training_jobs_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve training jobs',
      message: error.message
    });
  }
});

// Get training job by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const job = offlineTrainingService.getTrainingJob(id);

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
  } catch (error: any) {
    logger.error({ msg: 'get_training_job_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve training job',
      message: error.message
    });
  }
});

// Create new training job
router.post('/', authenticateToken, async (req, res) => {
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
      outputDir: config.outputDir || path.join(process.cwd(), 'data', 'training', `job_${Date.now()}`)
    };
    const job = await offlineTrainingService.createTrainingJob(name, datasetId, processedConfig, baseModelId);

    return res.status(201).json({
      success: true,
      data: job,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'create_training_job_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to create training job',
      message: error.message
    });
  }
});

// Start training
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await offlineTrainingService.startTraining(id);

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
  } catch (error: any) {
    logger.error({ msg: 'start_training_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to start training',
      message: error.message
    });
  }
});

// Pause training
router.post('/:id/pause', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const success = offlineTrainingService.pauseTraining(id);

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
  } catch (error: any) {
    logger.error({ msg: 'pause_training_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to pause training',
      message: error.message
    });
  }
});

// Resume training
router.post('/:id/resume', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const success = offlineTrainingService.resumeTraining(id);

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
  } catch (error: any) {
    logger.error({ msg: 'resume_training_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to resume training',
      message: error.message
    });
  }
});

// Cancel training
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const success = offlineTrainingService.cancelTraining(id);

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
  } catch (error: any) {
    logger.error({ msg: 'cancel_training_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel training',
      message: error.message
    });
  }
});

// Delete training job
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const success = offlineTrainingService.deleteTrainingJob(id);

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
  } catch (error: any) {
    logger.error({ msg: 'delete_training_job_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to delete training job',
      message: error.message
    });
  }
});

// Get training logs
router.get('/:id/logs', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const job = offlineTrainingService.getTrainingJob(id);

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
  } catch (error: any) {
    logger.error({ msg: 'get_training_logs_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve training logs',
      message: error.message
    });
  }
});

// Get training metrics
router.get('/:id/metrics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const job = offlineTrainingService.getTrainingJob(id);

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
  } catch (error: any) {
    logger.error({ msg: 'get_training_metrics_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve training metrics',
      message: error.message
    });
  }
});

// Get training statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = offlineTrainingService.getStats();

    return res.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'get_training_stats_failed', error: error.message });
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

export default router;
