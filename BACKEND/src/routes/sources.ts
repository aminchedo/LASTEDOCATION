// BACKEND/src/routes/sources.ts - FIXED VERSION

import { Router, Request, Response } from 'express';
import { logger } from '../middleware/logger';
import { startDownload, getDownloadJob, getAllDownloadJobs, cancelDownload } from '../services/downloads';
import { MODEL_CATALOG, getModelById, getModelsByType, searchModels } from '../config/modelCatalog';

const router = Router();

// ====== GET CATALOG ======

/**
 * GET /api/sources/catalog
 * Get all models from catalog
 */
router.get('/catalog', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: MODEL_CATALOG,
      total: MODEL_CATALOG.length
    });
  } catch (error: any) {
    logger.error(`Error getting catalog: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sources/catalog/:id
 * Get specific model from catalog
 */
router.get('/catalog/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const modelId = decodeURIComponent(req.params.id);
    const model = getModelById(modelId);

    if (!model) {
      res.status(404).json({
        success: false,
        error: 'Model not found in catalog',
        modelId
      });
      return;
    }

    res.json({
      success: true,
      data: model
    });
  } catch (error: any) {
    logger.error(`Error getting model: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sources/catalog/type/:type
 * Get models by type (model, tts, dataset)
 */
router.get('/catalog/type/:type', async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.params.type as 'model' | 'tts' | 'dataset';

    if (!['model', 'tts', 'dataset'].includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid type. Must be: model, tts, or dataset'
      });
      return;
    }

    const models = getModelsByType(type);

    res.json({
      success: true,
      data: models,
      total: models.length,
      type
    });
  } catch (error: any) {
    logger.error(`Error getting models by type: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sources/catalog/search
 * Search models in catalog
 */
router.get('/catalog/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Missing search query parameter: q'
      });
      return;
    }

    const results = searchModels(query);

    res.json({
      success: true,
      data: results,
      total: results.length,
      query
    });
  } catch (error: any) {
    logger.error(`Error searching catalog: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====== DOWNLOAD MANAGEMENT ======

/**
 * POST /api/sources/download
 * Start downloading a model from catalog
 */
router.post('/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const { modelId, destination, token } = req.body;

    if (!modelId) {
      res.status(400).json({
        success: false,
        error: 'modelId is required'
      });
      return;
    }

    // Get model from catalog
    const model = getModelById(modelId);
    if (!model) {
      res.status(404).json({
        success: false,
        error: 'Model not found in catalog',
        modelId
      });
      return;
    }

    // Use default destination or custom
    const dest = destination || model.defaultDest || `downloads/${model.id.replace('/', '_')}`;

    logger.info({
      msg: 'Starting model download from catalog',
      modelId,
      dest,
      hasToken: !!token
    });

    // Start download with optional HuggingFace token
    const job = await startDownload(
      model.type,
      model.id,
      model.repoType,
      dest,
      token
    );

    res.json({
      success: true,
      data: {
        jobId: job.id,
        modelId: model.id,
        modelName: model.name,
        destination: dest,
        message: 'Download started successfully'
      }
    });
  } catch (error: any) {
    logger.error(`Error starting download: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sources/downloads
 * Get all download jobs
 */
router.get('/downloads', async (_req: Request, res: Response): Promise<void> => {
  try {
    const downloads = getAllDownloadJobs();

    res.json({
      success: true,
      data: downloads,
      total: downloads.length
    });
  } catch (error: any) {
    logger.error(`Error getting downloads: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sources/download/:jobId
 * Get download status
 */
router.get('/download/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = getDownloadJob(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Download job not found',
        jobId
      });
      return;
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error: any) {
    logger.error(`Error getting download status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/sources/download/:jobId
 * Cancel download
 */
router.delete('/download/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const cancelled = cancelDownload(jobId);

    if (!cancelled) {
      res.status(404).json({
        success: false,
        error: 'Download job not found or already completed',
        jobId
      });
      return;
    }

    res.json({
      success: true,
      message: 'Download cancelled',
      jobId
    });
  } catch (error: any) {
    logger.error(`Error cancelling download: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====== LEGACY ENDPOINTS (for backward compatibility) ======

/**
 * GET /api/sources/models/available
 * Get available models (legacy endpoint)
 */
router.get('/models/available', async (_req: Request, res: Response): Promise<void> => {
  try {
    const models = getModelsByType('model');
    res.json({
      success: true,
      data: models
    });
  } catch (error: any) {
    logger.error(`Error getting available models: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sources/datasets/available
 * Get available datasets (legacy endpoint)
 */
router.get('/datasets/available', async (_req: Request, res: Response): Promise<void> => {
  try {
    const datasets = getModelsByType('dataset');
    res.json({
      success: true,
      data: datasets
    });
  } catch (error: any) {
    logger.error(`Error getting available datasets: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sources/installed
 * Get installed models and datasets
 */
router.get('/installed', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get downloaded models and datasets
    const allJobs = getAllDownloadJobs();
    const completedJobs = allJobs.filter(job => job.status === 'completed');

    const models = completedJobs
      .filter(job => {
        const modelInfo = getModelById(job.repoId);
        return modelInfo && (modelInfo.type === 'model' || modelInfo.type === 'tts');
      })
      .map(job => {
        const modelInfo = getModelById(job.repoId);
        return {
          id: job.repoId,
          name: modelInfo?.name || job.repoId,
          type: modelInfo?.type || 'model',
          size: modelInfo?.size || 'Unknown',
          downloadedAt: job.finishedAt,
          path: job.dest
        };
      });

    const datasets = completedJobs
      .filter(job => {
        const modelInfo = getModelById(job.repoId);
        return modelInfo && modelInfo.type === 'dataset';
      })
      .map(job => {
        const modelInfo = getModelById(job.repoId);
        return {
          id: job.repoId,
          name: modelInfo?.name || job.repoId,
          type: 'dataset',
          size: modelInfo?.size || 'Unknown',
          downloadedAt: job.finishedAt,
          path: job.dest
        };
      });

    res.json({
      success: true,
      data: {
        models,
        datasets,
        all: [...models, ...datasets]
      }
    });
  } catch (error: any) {
    logger.error(`Error getting installed sources: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
