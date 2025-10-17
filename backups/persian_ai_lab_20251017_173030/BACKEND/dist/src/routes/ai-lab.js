"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const logger_1 = require("../config/logger");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const validateRequest_1 = require("../middleware/validateRequest");
const AILabService_1 = require("../services/ai-lab/AILabService");
const DatasetService_1 = require("../services/ai-lab/DatasetService");
const ModelService_1 = require("../services/ai-lab/ModelService");
const TTSService_1 = require("../services/ai-lab/TTSService");
const ai_lab_security_1 = require("../middleware/ai-lab-security");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'storage', 'ai-lab', 'uploads');
        await fs_extra_1.default.ensureDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.json', '.txt', '.jsonl'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only CSV, JSON, JSONL and TXT files are allowed.'));
        }
    }
});
// Apply auth middleware to all routes
router.use(auth_1.authenticateToken);
// Apply cleanup middleware
router.use(ai_lab_security_1.cleanupTempFiles);
// Initialize services
const aiLabService = new AILabService_1.AILabService();
const datasetService = new DatasetService_1.DatasetService();
const modelService = new ModelService_1.ModelService();
const ttsService = new TTSService_1.TTSService();
/**
 * POST /api/ai-lab/train
 * Start a TensorFlow.js model training session
 */
router.post('/train', (0, ai_lab_security_1.rateLimitOperation)('training'), ai_lab_security_1.validateModelConfig, (0, validateRequest_1.validateRequest)([
    (0, express_validator_1.body)('modelName').notEmpty().withMessage('Model name is required'),
    (0, express_validator_1.body)('modelType').isIn(['tts', 'stt', 'nlp', 'cv', 'custom']).withMessage('Invalid model type'),
    (0, express_validator_1.body)('architecture').isIn(['transformer', 'lstm', 'cnn', 'gru', 'bert', 'custom']).withMessage('Invalid architecture'),
    (0, express_validator_1.body)('datasetId').notEmpty().withMessage('Dataset ID is required'),
    (0, express_validator_1.body)('parameters').isObject().withMessage('Parameters must be an object'),
    (0, express_validator_1.body)('parameters.epochs').isInt({ min: 1, max: 1000 }).withMessage('Epochs must be between 1 and 1000'),
    (0, express_validator_1.body)('parameters.batchSize').isInt({ min: 1, max: 512 }).withMessage('Batch size must be between 1 and 512'),
    (0, express_validator_1.body)('parameters.learningRate').isFloat({ min: 0.00001, max: 1 }).withMessage('Learning rate must be between 0.00001 and 1'),
    (0, express_validator_1.body)('parameters.optimizer').isIn(['adam', 'sgd', 'rmsprop', 'adagrad']).withMessage('Invalid optimizer')
]), async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const trainingConfig = {
            userId,
            modelName: (0, ai_lab_security_1.sanitizeInput)(req.body.modelName),
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
    }
    catch (error) {
        logger_1.logger.error('Failed to start training:', error);
        res.status(500).json({ error: error.message || 'Failed to start training' });
    }
});
/**
 * POST /api/ai-lab/upload
 * Upload and validate a dataset
 */
router.post('/upload', (0, ai_lab_security_1.rateLimitOperation)('upload'), upload.single('dataset'), ai_lab_security_1.validateFileUpload, (0, validateRequest_1.validateRequest)([
    (0, express_validator_1.body)('name').notEmpty().withMessage('Dataset name is required'),
    (0, express_validator_1.body)('type').isIn(['text', 'audio', 'structured']).withMessage('Invalid dataset type'),
    (0, express_validator_1.body)('description').optional().isString()
]), async (req, res) => {
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
            name: (0, ai_lab_security_1.sanitizeInput)(req.body.name),
            type: req.body.type,
            description: (0, ai_lab_security_1.sanitizeInput)(req.body.description),
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
    }
    catch (error) {
        logger_1.logger.error('Failed to upload dataset:', error);
        // Clean up uploaded file on error
        if (req.file?.path) {
            fs_extra_1.default.unlink(req.file.path).catch(() => { });
        }
        res.status(500).json({ error: error.message || 'Failed to upload dataset' });
    }
});
/**
 * GET /api/ai-lab/status/:jobId
 * Get live training metrics
 */
router.get('/status/:jobId', (0, validateRequest_1.validateRequest)([
    (0, express_validator_1.param)('jobId').notEmpty().withMessage('Job ID is required')
]), async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await aiLabService.getTrainingStatus(jobId);
        if (!status) {
            res.status(404).json({ error: 'Training job not found' });
            return;
        }
        res.json(status);
    }
    catch (error) {
        logger_1.logger.error('Failed to get training status:', error);
        res.status(500).json({ error: error.message || 'Failed to get training status' });
    }
});
/**
 * GET /api/ai-lab/export/:modelId
 * Export current trained model
 */
router.get('/export/:modelId', (0, ai_lab_security_1.rateLimitOperation)('export'), (0, validateRequest_1.validateRequest)([
    (0, express_validator_1.param)('modelId').notEmpty().withMessage('Model ID is required')
]), async (req, res) => {
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
                logger_1.logger.error('Failed to send model export:', err);
            }
            // Clean up the temporary zip file
            fs_extra_1.default.unlink(exportPath).catch(() => { });
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to export model:', error);
        res.status(500).json({ error: error.message || 'Failed to export model' });
    }
});
/**
 * POST /api/ai-lab/import
 * Import a previously trained model
 */
router.post('/import', upload.single('model'), (0, validateRequest_1.validateRequest)([
    (0, express_validator_1.body)('name').notEmpty().withMessage('Model name is required'),
    (0, express_validator_1.body)('type').isIn(['tts', 'stt', 'nlp', 'cv', 'custom']).withMessage('Invalid model type')
]), async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to import model:', error);
        // Clean up uploaded file on error
        if (req.file?.path) {
            fs_extra_1.default.unlink(req.file.path).catch(() => { });
        }
        res.status(500).json({ error: error.message || 'Failed to import model' });
    }
});
/**
 * GET /api/ai-lab/datasets
 * List available datasets
 */
router.get('/datasets', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const datasets = await datasetService.listDatasets(userId);
        res.json({ datasets });
    }
    catch (error) {
        logger_1.logger.error('Failed to list datasets:', error);
        res.status(500).json({ error: error.message || 'Failed to list datasets' });
    }
});
/**
 * GET /api/ai-lab/models
 * List available trained models and TTS checkpoints
 */
router.get('/models', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const models = await modelService.listModels(userId);
        const ttsModels = await ttsService.listTTSModels();
        res.json({
            trainedModels: models,
            ttsModels
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to list models:', error);
        res.status(500).json({ error: error.message || 'Failed to list models' });
    }
});
/**
 * POST /api/ai-lab/inference
 * Run real inference on text input using selected model
 */
router.post('/inference', (0, validateRequest_1.validateRequest)([
    (0, express_validator_1.body)('modelId').notEmpty().withMessage('Model ID is required'),
    (0, express_validator_1.body)('input').notEmpty().withMessage('Input text is required'),
    (0, express_validator_1.body)('type').isIn(['text', 'audio']).withMessage('Invalid inference type')
]), async (req, res) => {
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
        }
        else {
            // Text inference
            result = await modelService.runInference(modelId, input, userId);
        }
        res.json({
            success: true,
            result,
            message: 'Inference completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to run inference:', error);
        res.status(500).json({ error: error.message || 'Failed to run inference' });
    }
});
/**
 * POST /api/ai-lab/settings
 * Update AI Lab settings including base directory
 */
router.post('/settings', (0, validateRequest_1.validateRequest)([
    (0, express_validator_1.body)('baseDirectory').optional().isString(),
    (0, express_validator_1.body)('gpuEnabled').optional().isBoolean(),
    (0, express_validator_1.body)('maxConcurrentJobs').optional().isInt({ min: 1, max: 10 })
]), async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to update settings:', error);
        res.status(500).json({ error: error.message || 'Failed to update settings' });
    }
});
/**
 * GET /api/ai-lab/settings
 * Get current AI Lab settings
 */
router.get('/settings', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const settings = await aiLabService.getSettings(userId);
        res.json(settings);
    }
    catch (error) {
        logger_1.logger.error('Failed to get settings:', error);
        res.status(500).json({ error: error.message || 'Failed to get settings' });
    }
});
exports.default = router;
//# sourceMappingURL=ai-lab.js.map