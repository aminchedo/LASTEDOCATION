"use strict";
/**
 * Model Management API Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const modelManager_1 = require("../services/modelManager");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../middleware/logger");
const tts_1 = require("../services/tts");
const router = express_1.default.Router();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    dest: path_1.default.join(process.cwd(), 'data', 'cache'),
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
        }
        else {
            cb(new Error('Invalid file type. Only model files are allowed.'));
        }
    }
});
// Validation schemas
const createModelSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(500),
    version: zod_1.z.string().min(1).max(20),
    type: zod_1.z.enum(['llm', 'stt', 'tts', 'embedding', 'classification']),
    framework: zod_1.z.enum(['pytorch', 'tensorflow', 'onnx', 'huggingface', 'custom']),
    language: zod_1.z.string().min(2).max(10),
    source: zod_1.z.string().min(1).max(200),
    tags: zod_1.z.array(zod_1.z.string()).max(20),
    metrics: zod_1.z.object({
        accuracy: zod_1.z.number().optional(),
        loss: zod_1.z.number().optional(),
        perplexity: zod_1.z.number().optional(),
        bleu: zod_1.z.number().optional(),
        rouge: zod_1.z.number().optional()
    }).optional(),
    requirements: zod_1.z.object({
        python: zod_1.z.string().optional(),
        pytorch: zod_1.z.string().optional(),
        transformers: zod_1.z.string().optional(),
        dependencies: zod_1.z.array(zod_1.z.string()).optional()
    }).optional()
});
const updateModelSchema = createModelSchema.partial();
// Get all models
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { type, language, framework, search } = req.query;
        let models;
        if (search && typeof search === 'string') {
            models = modelManager_1.modelManager.searchModels(search);
        }
        else if (type && typeof type === 'string') {
            models = modelManager_1.modelManager.getModelsByType(type);
        }
        else if (language && typeof language === 'string') {
            models = modelManager_1.modelManager.getModelsByLanguage(language);
        }
        else if (framework && typeof framework === 'string') {
            models = modelManager_1.modelManager.getModelsByFramework(framework);
        }
        else {
            models = modelManager_1.modelManager.getAllModels();
        }
        res.json({
            success: true,
            data: models,
            meta: {
                total: models.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_models_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve models',
            message: error.message
        });
    }
});
// Get model by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const model = modelManager_1.modelManager.getModel(id);
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
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_model_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve model',
            message: error.message
        });
    }
});
// Create new model
router.post('/', auth_1.authenticateToken, upload.single('file'), async (req, res) => {
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
        const model = await modelManager_1.modelManager.addModel(req.file.path, {
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
    }
    catch (error) {
        logger_1.logger.error({ msg: 'create_model_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to create model',
            message: error.message
        });
    }
});
// Update model
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
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
        const model = modelManager_1.modelManager.updateModel(id, processedUpdates);
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
    }
    catch (error) {
        logger_1.logger.error({ msg: 'update_model_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to update model',
            message: error.message
        });
    }
});
// Delete model
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const success = modelManager_1.modelManager.deleteModel(id);
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
    }
    catch (error) {
        logger_1.logger.error({ msg: 'delete_model_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to delete model',
            message: error.message
        });
    }
});
// Start model download
router.post('/download', auth_1.authenticateToken, async (req, res) => {
    try {
        const { modelId, source, url } = req.body;
        if (!modelId || !source || !url) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Model ID, source, and URL are required'
            });
        }
        const download = await modelManager_1.modelManager.startDownload(modelId, source, url);
        return res.status(201).json({
            success: true,
            data: download,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'start_model_download_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to start model download',
            message: error.message
        });
    }
});
// Get download status
router.get('/downloads/:downloadId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { downloadId } = req.params;
        const download = modelManager_1.modelManager.getDownload(downloadId);
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
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_download_status_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve download status',
            message: error.message
        });
    }
});
// Get all downloads
router.get('/downloads', auth_1.authenticateToken, async (req, res) => {
    try {
        const downloads = modelManager_1.modelManager.getAllDownloads();
        res.json({
            success: true,
            data: downloads,
            meta: {
                total: downloads.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_downloads_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve downloads',
            message: error.message
        });
    }
});
// Cancel download
router.delete('/downloads/:downloadId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { downloadId } = req.params;
        const success = modelManager_1.modelManager.cancelDownload(downloadId);
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
    }
    catch (error) {
        logger_1.logger.error({ msg: 'cancel_download_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to cancel download',
            message: error.message
        });
    }
});
// Create model version
router.post('/:id/versions', auth_1.authenticateToken, async (req, res) => {
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
        const modelVersion = modelManager_1.modelManager.createVersion(id, version, changes);
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
    }
    catch (error) {
        logger_1.logger.error({ msg: 'create_model_version_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to create model version',
            message: error.message
        });
    }
});
// Validate model
router.post('/:id/validate', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const validation = modelManager_1.modelManager.validateModel(id);
        return res.json({
            success: true,
            data: validation,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'validate_model_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to validate model',
            message: error.message
        });
    }
});
// Export model
router.post('/:id/export', auth_1.authenticateToken, async (req, res) => {
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
        const success = modelManager_1.modelManager.exportModel(id, targetPath);
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
    }
    catch (error) {
        logger_1.logger.error({ msg: 'export_model_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to export model',
            message: error.message
        });
    }
});
// Get model statistics
router.get('/stats/overview', auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = modelManager_1.modelManager.getStats();
        return res.json({
            success: true,
            data: stats,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_model_stats_failed', error: error.message });
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
router.get('/detected', auth_1.authenticateToken, async (req, res) => {
    try {
        // Get all models from the model manager
        const models = modelManager_1.modelManager.getAllModels();
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
        const ttsVoices = tts_1.ttsService.getVoices();
        const ttsModels = ttsVoices.map(voice => ({
            id: `tts-${voice.name}`,
            name: voice.name,
            type: 'tts',
            modelFormat: 'voice',
            framework: 'internal',
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
    }
    catch (error) {
        logger_1.logger.error({ msg: 'detect_models_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to detect models',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=models.js.map