import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { logger } from '../config/logger';
import { authenticateToken } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { AILabService } from '../services/ai-lab/AILabService';
import { DatasetService } from '../services/ai-lab/DatasetService';
import { ModelService } from '../services/ai-lab/ModelService';
import { TTSService } from '../services/ai-lab/TTSService';
import { getSocketIOInstance } from '../services/websocket.service';
import { 
  validateFileUpload, 
  rateLimitOperation, 
  validateModelConfig,
  cleanupTempFiles,
  sanitizePath,
  sanitizeInput
} from '../middleware/ai-lab-security';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'storage', 'ai-lab', 'uploads');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.txt', '.jsonl'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, JSONL and TXT files are allowed.'));
    }
  }
});

// Apply auth middleware to all routes
router.use(authenticateToken);
// Apply cleanup middleware
router.use(cleanupTempFiles);

// Initialize services
const aiLabService = new AILabService();
const datasetService = new DatasetService();
const modelService = new ModelService();
const ttsService = new TTSService();

/**
 * POST /api/ai-lab/train
 * Start a TensorFlow.js model training session
 */
router.post('/train',
  rateLimitOperation('training'),
  validateModelConfig,
  validateRequest([
    body('modelName').notEmpty().withMessage('Model name is required'),
    body('modelType').isIn(['tts', 'stt', 'nlp', 'cv', 'custom']).withMessage('Invalid model type'),
    body('architecture').isIn(['transformer', 'lstm', 'cnn', 'gru', 'bert', 'custom']).withMessage('Invalid architecture'),
    body('datasetId').notEmpty().withMessage('Dataset ID is required'),
    body('parameters').isObject().withMessage('Parameters must be an object'),
    body('parameters.epochs').isInt({ min: 1, max: 1000 }).withMessage('Epochs must be between 1 and 1000'),
    body('parameters.batchSize').isInt({ min: 1, max: 512 }).withMessage('Batch size must be between 1 and 512'),
    body('parameters.learningRate').isFloat({ min: 0.00001, max: 1 }).withMessage('Learning rate must be between 0.00001 and 1'),
    body('parameters.optimizer').isIn(['adam', 'sgd', 'rmsprop', 'adagrad']).withMessage('Invalid optimizer')
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const trainingConfig = {
        userId,
        modelName: sanitizeInput(req.body.modelName),
        modelType: req.body.modelType,
        architecture: req.body.architecture,
        datasetId: req.body.datasetId,
        parameters: req.body.parameters,
        layers: req.body.layers || 12
      };

      const jobId = await aiLabService.startTraining(trainingConfig);
      
      res.json({ 
        success: true, 
        jobId,
        message: 'Training job started successfully'
      });
    } catch (error: any) {
      logger.error('Failed to start training:', error);
      res.status(500).json({ error: error.message || 'Failed to start training' });
    }
  }
);

/**
 * POST /api/ai-lab/upload
 * Upload and validate a dataset
 */
router.post('/upload',
  rateLimitOperation('upload'),
  upload.single('dataset'),
  validateFileUpload,
  validateRequest([
    body('name').notEmpty().withMessage('Dataset name is required'),
    body('type').isIn(['text', 'audio', 'structured']).withMessage('Invalid dataset type'),
    body('description').optional().isString()
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const datasetInfo = {
        userId,
        name: sanitizeInput(req.body.name),
        type: req.body.type,
        description: sanitizeInput(req.body.description),
        filePath: req.file.path,
        originalName: req.file.originalname,
        size: req.file.size
      };

      const dataset = await datasetService.processDataset(datasetInfo);
      
      res.json({ 
        success: true, 
        dataset,
        message: 'Dataset uploaded and processed successfully'
      });
    } catch (error: any) {
      logger.error('Failed to upload dataset:', error);
      // Clean up uploaded file on error
      if (req.file?.path) {
        fs.unlink(req.file.path).catch(() => {});
      }
      res.status(500).json({ error: error.message || 'Failed to upload dataset' });
    }
  }
);

/**
 * GET /api/ai-lab/status/:jobId
 * Get live training metrics
 */
router.get('/status/:jobId',
  validateRequest([
    param('jobId').notEmpty().withMessage('Job ID is required')
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      const status = await aiLabService.getTrainingStatus(jobId);
      
      if (!status) {
        res.status(404).json({ error: 'Training job not found' });
        return;
      }

      res.json(status);
    } catch (error: any) {
      logger.error('Failed to get training status:', error);
      res.status(500).json({ error: error.message || 'Failed to get training status' });
    }
  }
);

/**
 * GET /api/ai-lab/export/:modelId
 * Export current trained model
 */
router.get('/export/:modelId',
  rateLimitOperation('export'),
  validateRequest([
    param('modelId').notEmpty().withMessage('Model ID is required')
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { modelId } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const exportPath = await modelService.exportModel(modelId, userId);
      
      // Send the model files as a zip
      res.download(exportPath, `model-${modelId}.zip`, (err) => {
        if (err) {
          logger.error('Failed to send model export:', err);
        }
        // Clean up the temporary zip file
        fs.unlink(exportPath).catch(() => {});
      });
    } catch (error: any) {
      logger.error('Failed to export model:', error);
      res.status(500).json({ error: error.message || 'Failed to export model' });
    }
  }
);

/**
 * POST /api/ai-lab/import
 * Import a previously trained model
 */
router.post('/import',
  upload.single('model'),
  validateRequest([
    body('name').notEmpty().withMessage('Model name is required'),
    body('type').isIn(['tts', 'stt', 'nlp', 'cv', 'custom']).withMessage('Invalid model type')
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No model file uploaded' });
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const modelInfo = {
        userId,
        name: req.body.name,
        type: req.body.type,
        filePath: req.file.path
      };

      const model = await modelService.importModel(modelInfo);
      
      res.json({ 
        success: true, 
        model,
        message: 'Model imported successfully'
      });
    } catch (error: any) {
      logger.error('Failed to import model:', error);
      // Clean up uploaded file on error
      if (req.file?.path) {
        fs.unlink(req.file.path).catch(() => {});
      }
      res.status(500).json({ error: error.message || 'Failed to import model' });
    }
  }
);

/**
 * GET /api/ai-lab/datasets
 * List available datasets
 */
router.get('/datasets', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const datasets = await datasetService.listDatasets(userId!);
    res.json({ datasets });
  } catch (error: any) {
    logger.error('Failed to list datasets:', error);
    res.status(500).json({ error: error.message || 'Failed to list datasets' });
  }
});

/**
 * GET /api/ai-lab/models
 * List available trained models and TTS checkpoints
 */
router.get('/models', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const models = await modelService.listModels(userId!);
    const ttsModels = await ttsService.listTTSModels();
    
    res.json({ 
      trainedModels: models,
      ttsModels 
    });
  } catch (error: any) {
    logger.error('Failed to list models:', error);
    res.status(500).json({ error: error.message || 'Failed to list models' });
  }
});

/**
 * POST /api/ai-lab/inference
 * Run real inference on text input using selected model
 */
router.post('/inference',
  validateRequest([
    body('modelId').notEmpty().withMessage('Model ID is required'),
    body('input').notEmpty().withMessage('Input text is required'),
    body('type').isIn(['text', 'audio']).withMessage('Invalid inference type')
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { modelId, input, type } = req.body;
      
      let result;
      if (type === 'audio') {
        // TTS inference
        result = await ttsService.generateSpeech(modelId, input, userId);
      } else {
        // Text inference
        result = await modelService.runInference(modelId, input, userId);
      }
      
      res.json({ 
        success: true,
        result,
        message: 'Inference completed successfully'
      });
    } catch (error: any) {
      logger.error('Failed to run inference:', error);
      res.status(500).json({ error: error.message || 'Failed to run inference' });
    }
  }
);

/**
 * POST /api/ai-lab/settings
 * Update AI Lab settings including base directory
 */
router.post('/settings',
  validateRequest([
    body('baseDirectory').optional().isString(),
    body('gpuEnabled').optional().isBoolean(),
    body('maxConcurrentJobs').optional().isInt({ min: 1, max: 10 })
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const settings = await aiLabService.updateSettings(userId, req.body);
      
      res.json({ 
        success: true,
        settings,
        message: 'Settings updated successfully'
      });
    } catch (error: any) {
      logger.error('Failed to update settings:', error);
      res.status(500).json({ error: error.message || 'Failed to update settings' });
    }
  }
);

/**
 * GET /api/ai-lab/settings
 * Get current AI Lab settings
 */
router.get('/settings', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const settings = await aiLabService.getSettings(userId!);
    
    res.json(settings);
  } catch (error: any) {
    logger.error('Failed to get settings:', error);
    res.status(500).json({ error: error.message || 'Failed to get settings' });
  }
});

export default router;