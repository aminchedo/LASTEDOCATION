import { Router } from 'express';
import { 
  startOptimizationJob, 
  getOptimizationJob, 
  getAllOptimizationJobs, 
  cancelOptimizationJob,
  createModelComparison,
  pruneModel,
  quantizeModel,
  getOptimizationMetrics
} from '../services/optimization';
import { HyperparameterConfig, PruningConfig, QuantizationConfig } from '../types/optimization';
import { logger } from '../middleware/logger';

const router = Router();

// POST /api/optimization/jobs - Start hyperparameter optimization
router.post('/jobs', async (req, res) => {
  try {
    const { 
      name, 
      baseModelPath, 
      datasetPath, 
      outputDir, 
      config, 
      strategy = 'random', 
      maxTrials = 10 
    } = req.body as {
      name: string;
      baseModelPath: string;
      datasetPath: string;
      outputDir: string;
      config: HyperparameterConfig;
      strategy?: 'grid' | 'random' | 'bayesian';
      maxTrials?: number;
    };

    if (!name || !baseModelPath || !datasetPath || !outputDir || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, baseModelPath, datasetPath, outputDir, config',
      });
    }

    // Validate config
    if (!config.learningRate || !config.batchSize || !config.epochs) {
      return res.status(400).json({
        success: false,
        error: 'Config must include learningRate, batchSize, and epochs',
      });
    }

    const job = await startOptimizationJob(
      name,
      baseModelPath,
      datasetPath,
      outputDir,
      config,
      strategy,
      maxTrials
    );

    return res.json({
      success: true,
      data: job,
      message: 'Optimization job started',
    });
  } catch (error: any) {
    logger.error({ msg: 'Error starting optimization job', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to start optimization job',
      message: error.message,
    });
  }
});

// GET /api/optimization/jobs - Get all optimization jobs
router.get('/jobs', (_req, res) => {
  try {
    const jobs = getAllOptimizationJobs();
    return res.json({
      success: true,
      data: jobs,
      count: jobs.length,
    });
  } catch (error: any) {
    logger.error({ msg: 'Error getting optimization jobs', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to get optimization jobs',
      message: error.message,
    });
  }
});

// GET /api/optimization/jobs/:jobId - Get specific optimization job
router.get('/jobs/:jobId', (req, res) => {
  try {
    const job = getOptimizationJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Optimization job not found',
      });
    }

    return res.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    logger.error({ msg: 'Error getting optimization job', jobId: req.params.jobId, error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to get optimization job',
      message: error.message,
    });
  }
});

// POST /api/optimization/jobs/:jobId/cancel - Cancel optimization job
router.post('/jobs/:jobId/cancel', (req, res) => {
  try {
    const success = cancelOptimizationJob(req.params.jobId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Optimization job not found or already completed',
      });
    }

    return res.json({
      success: true,
      message: 'Optimization job cancelled',
    });
  } catch (error: any) {
    logger.error({ msg: 'Error cancelling optimization job', jobId: req.params.jobId, error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel optimization job',
      message: error.message,
    });
  }
});

// POST /api/optimization/compare - Create model comparison
router.post('/compare', async (req, res) => {
  try {
    const { name, modelPaths, testDataset, comparisonMetrics } = req.body as {
      name: string;
      modelPaths: string[];
      testDataset: string;
      comparisonMetrics: string[];
    };

    if (!name || !modelPaths || !testDataset || !comparisonMetrics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, modelPaths, testDataset, comparisonMetrics',
      });
    }

    if (modelPaths.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 models required for comparison',
      });
    }

    const comparison = await createModelComparison(name, modelPaths, testDataset, comparisonMetrics);

    return res.json({
      success: true,
      data: comparison,
      message: 'Model comparison created',
    });
  } catch (error: any) {
    logger.error({ msg: 'Error creating model comparison', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to create model comparison',
      message: error.message,
    });
  }
});

// POST /api/optimization/prune - Prune a model
router.post('/prune', async (req, res) => {
  try {
    const { modelPath, outputPath, config } = req.body as {
      modelPath: string;
      outputPath: string;
      config: PruningConfig;
    };

    if (!modelPath || !outputPath || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelPath, outputPath, config',
      });
    }

    const result = await pruneModel(modelPath, outputPath, config);

    return res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error: any) {
    logger.error({ msg: 'Error pruning model', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to prune model',
      message: error.message,
    });
  }
});

// POST /api/optimization/quantize - Quantize a model
router.post('/quantize', async (req, res) => {
  try {
    const { modelPath, outputPath, config } = req.body as {
      modelPath: string;
      outputPath: string;
      config: QuantizationConfig;
    };

    if (!modelPath || !outputPath || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelPath, outputPath, config',
      });
    }

    const result = await quantizeModel(modelPath, outputPath, config);

    return res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error: any) {
    logger.error({ msg: 'Error quantizing model', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to quantize model',
      message: error.message,
    });
  }
});

// GET /api/optimization/metrics - Get optimization metrics
router.get('/metrics', (_req, res) => {
  try {
    const metrics = getOptimizationMetrics();
    return res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    logger.error({ msg: 'Error getting optimization metrics', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to get optimization metrics',
      message: error.message,
    });
  }
});

export default router;
