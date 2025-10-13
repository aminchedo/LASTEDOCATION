/**
 * Model Management API Routes
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { modelManager, ModelMetadata } from '../services/modelManager';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../middleware/logger';
import { ttsService } from '../services/tts';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(process.cwd(), 'data', 'cache'),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/octet-stream',
      'application/x-binary',
      'application/x-python-code',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.bin') || file.originalname.endsWith('.pt') || file.originalname.endsWith('.pth')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only model files are allowed.'));
    }
  }
});

// Validation schemas
const createModelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  version: z.string().min(1).max(20),
  type: z.enum(['llm', 'stt', 'tts', 'embedding', 'classification']),
  framework: z.enum(['pytorch', 'tensorflow', 'onnx', 'huggingface', 'custom']),
  language: z.string().min(2).max(10),
  source: z.string().min(1).max(200),
  tags: z.array(z.string()).max(20),
  metrics: z.object({
    accuracy: z.number().optional(),
    loss: z.number().optional(),
    perplexity: z.number().optional(),
    bleu: z.number().optional(),
    rouge: z.number().optional()
  }).optional(),
  requirements: z.object({
    python: z.string().optional(),
    pytorch: z.string().optional(),
    transformers: z.string().optional(),
    dependencies: z.array(z.string()).optional()
  }).optional()
});

const updateModelSchema = createModelSchema.partial();

// Get all models
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, language, framework, search } = req.query;

    let models: ModelMetadata[];

    if (search && typeof search === 'string') {
      models = modelManager.searchModels(search);
    } else if (type && typeof type === 'string') {
      models = modelManager.getModelsByType(type as ModelMetadata['type']);
    } else if (language && typeof language === 'string') {
      models = modelManager.getModelsByLanguage(language);
    } else if (framework && typeof framework === 'string') {
      models = modelManager.getModelsByFramework(framework as ModelMetadata['framework']);
    } else {
      models = modelManager.getAllModels();
    }

    res.json({
      success: true,
      data: models,
      meta: {
        total: models.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'get_models_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve models',
      message: error.message
    });
  }
});

// Get model by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const model = modelManager.getModel(id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `Model with ID ${id} does not exist`
      });
    }

    return res.json({
      success: true,
      data: model,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'get_model_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve model',
      message: error.message
    });
  }
});

// Create new model
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a model file'
      });
    }

    const validation = createModelSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid model metadata',
        details: validation.error.flatten()
      });
    }

    const metadata = validation.data;
    const model = await modelManager.addModel(req.file.path, {
      ...metadata,
      metrics: metadata.metrics || {},
      requirements: {
        ...metadata.requirements,
        dependencies: metadata.requirements?.dependencies || []
      }
    });

    return res.status(201).json({
      success: true,
      data: model,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'create_model_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to create model',
      message: error.message
    });
  }
});

// Update model
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateModelSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid model metadata',
        details: validation.error.flatten()
      });
    }

    const updates = validation.data;
    const processedUpdates = {
      ...updates,
      requirements: updates.requirements ? {
        ...updates.requirements,
        dependencies: updates.requirements.dependencies || []
      } : undefined
    };
    const model = modelManager.updateModel(id, processedUpdates);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `Model with ID ${id} does not exist`
      });
    }

    return res.json({
      success: true,
      data: model,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'update_model_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to update model',
      message: error.message
    });
  }
});

// Delete model
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const success = modelManager.deleteModel(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `Model with ID ${id} does not exist`
      });
    }

    return res.json({
      success: true,
      message: 'Model deleted successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'delete_model_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to delete model',
      message: error.message
    });
  }
});

// Start model download
router.post('/download', authenticateToken, async (req, res) => {
  try {
    const { modelId, source, url } = req.body;

    if (!modelId || !source || !url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Model ID, source, and URL are required'
      });
    }

    const download = await modelManager.startDownload(modelId, source, url);

    return res.status(201).json({
      success: true,
      data: download,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'start_model_download_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to start model download',
      message: error.message
    });
  }
});

// Get download status
router.get('/downloads/:downloadId', authenticateToken, async (req, res) => {
  try {
    const { downloadId } = req.params;
    const download = modelManager.getDownload(downloadId);

    if (!download) {
      return res.status(404).json({
        success: false,
        error: 'Download not found',
        message: `Download with ID ${downloadId} does not exist`
      });
    }

    return res.json({
      success: true,
      data: download,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'get_download_status_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve download status',
      message: error.message
    });
  }
});

// Get all downloads
router.get('/downloads', authenticateToken, async (req, res) => {
  try {
    const downloads = modelManager.getAllDownloads();

    res.json({
      success: true,
      data: downloads,
      meta: {
        total: downloads.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'get_downloads_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve downloads',
      message: error.message
    });
  }
});

// Cancel download
router.delete('/downloads/:downloadId', authenticateToken, async (req, res) => {
  try {
    const { downloadId } = req.params;
    const success = modelManager.cancelDownload(downloadId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Download not found',
        message: `Download with ID ${downloadId} does not exist or is already completed`
      });
    }

    return res.json({
      success: true,
      message: 'Download cancelled successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'cancel_download_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel download',
      message: error.message
    });
  }
});

// Create model version
router.post('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { version, changes } = req.body;

    if (!version || !changes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Version and changes are required'
      });
    }

    const modelVersion = modelManager.createVersion(id, version, changes);

    if (!modelVersion) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `Model with ID ${id} does not exist`
      });
    }

    return res.status(201).json({
      success: true,
      data: modelVersion,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'create_model_version_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to create model version',
      message: error.message
    });
  }
});

// Validate model
router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validation = modelManager.validateModel(id);

    return res.json({
      success: true,
      data: validation,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'validate_model_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to validate model',
      message: error.message
    });
  }
});

// Export model
router.post('/:id/export', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { targetPath } = req.body;

    if (!targetPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing target path',
        message: 'Target path is required for export'
      });
    }

    const success = modelManager.exportModel(id, targetPath);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `Model with ID ${id} does not exist`
      });
    }

    return res.json({
      success: true,
      message: 'Model exported successfully',
      data: { targetPath },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'export_model_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to export model',
      message: error.message
    });
  }
});

// Get model statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = modelManager.getStats();

    return res.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'get_model_stats_failed', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve model statistics',
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
      service: 'model-management',
      timestamp: new Date().toISOString()
    }
  });
});

// ✅ GET /api/models/detected - Detect installed models
router.get('/detected', authenticateToken, async (req, res) => {
  try {
    // Get all models from the model manager
    const models = modelManager.getAllModels();

    // Transform to detected model format
    const detectedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      type: model.type,
      modelFormat: model.framework,
      framework: model.framework,
      size: model.size,
      path: model.filePath,
      version: model.version,
      language: model.language,
      tags: model.tags,
      isLocal: true,
      isTrainedModel: false,
      files: [],
      lastModified: model.updatedAt || new Date().toISOString()
    }));

    // Add TTS voices as models
    const ttsVoices = ttsService.getVoices();
    const ttsModels = ttsVoices.map(voice => ({
      id: `tts-${voice.name}`,
      name: voice.name,
      type: 'tts' as const,
      modelFormat: 'voice' as const,
      framework: 'internal' as const,
      path: 'internal://tts/voices',
      size: 0,
      files: [],
      description: `${voice.gender === 'male' ? 'مرد' : 'زن'} - ${voice.age === 'young' ? 'جوان' : voice.age === 'middle' ? 'میانسال' : 'مسن'} - لهجه ${voice.accent === 'tehran' ? 'تهران' : voice.accent === 'isfahan' ? 'اصفهان' : voice.accent === 'shiraz' ? 'شیراز' : 'مشهد'}`,
      language: ['fa', 'fa-IR'],
      tags: [voice.gender, voice.age, voice.accent, voice.quality, 'tts', 'persian', 'voice'],
      isLocal: true,
      isTrainedModel: false,
      lastModified: new Date().toISOString(),
      metadata: {
        gender: voice.gender,
        age: voice.age,
        accent: voice.accent,
        quality: voice.quality,
        isInternal: true,
        voiceType: 'persian-tts'
      }
    }));

    // Combine all models
    const allModels = [...detectedModels, ...ttsModels];

    res.json({
      success: true,
      data: allModels,
      models: allModels, // For backward compatibility
      statistics: {
        total_models: allModels.length,
        by_type: {
          tts: ttsModels.length,
          llm: detectedModels.filter(m => m.type === 'llm').length,
          stt: detectedModels.filter(m => m.type === 'stt').length,
          embedding: detectedModels.filter(m => m.type === 'embedding').length,
          classification: detectedModels.filter(m => m.type === 'classification').length
        },
        total_size_bytes: detectedModels.reduce((sum, m) => sum + m.size, 0)
      },
      meta: {
        total: allModels.length,
        ttsVoices: ttsModels.length,
        fileModels: detectedModels.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'detect_models_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to detect models',
      message: error.message
    });
  }
});

export default router;