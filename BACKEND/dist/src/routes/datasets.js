"use strict";
/**
 * Dataset Management API Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const datasetManager_1 = require("../services/datasetManager");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../middleware/logger");
const router = express_1.default.Router();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    dest: path_1.default.join(process.cwd(), 'data', 'cache'),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/json', 'text/plain', 'text/csv'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JSON, TXT, and CSV files are allowed.'));
        }
    }
});
// Validation schemas
const createDatasetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(500),
    version: zod_1.z.string().min(1).max(20),
    format: zod_1.z.enum(['json', 'jsonl', 'csv', 'txt', 'parquet']),
    language: zod_1.z.string().min(2).max(10),
    source: zod_1.z.string().min(1).max(200),
    tags: zod_1.z.array(zod_1.z.string()).max(20)
});
const updateDatasetSchema = createDatasetSchema.partial();
// Get all datasets
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { language, tag, search } = req.query;
        let datasets;
        if (search && typeof search === 'string') {
            datasets = datasetManager_1.datasetManager.searchDatasets(search);
        }
        else if (language && typeof language === 'string') {
            datasets = datasetManager_1.datasetManager.getDatasetsByLanguage(language);
        }
        else if (tag && typeof tag === 'string') {
            datasets = datasetManager_1.datasetManager.getDatasetsByTag(tag);
        }
        else {
            datasets = datasetManager_1.datasetManager.getAllDatasets();
        }
        res.json({
            success: true,
            data: datasets,
            meta: {
                total: datasets.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_datasets_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve datasets',
            message: error.message
        });
    }
});
// Get dataset by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const dataset = datasetManager_1.datasetManager.getDataset(id);
        if (!dataset) {
            return res.status(404).json({
                success: false,
                error: 'Dataset not found',
                message: `Dataset with ID ${id} does not exist`
            });
        }
        return res.json({
            success: true,
            data: dataset,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_dataset_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve dataset',
            message: error.message
        });
    }
});
// Create new dataset
router.post('/', auth_1.authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
                message: 'Please upload a dataset file'
            });
        }
        const validation = createDatasetSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Invalid dataset metadata',
                details: validation.error.flatten()
            });
        }
        const metadata = validation.data;
        const dataset = await datasetManager_1.datasetManager.addDataset(req.file.path, {
            ...metadata,
            size: 0 // Will be calculated by the service
        });
        return res.status(201).json({
            success: true,
            data: dataset,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'create_dataset_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to create dataset',
            message: error.message
        });
    }
});
// Update dataset
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const validation = updateDatasetSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Invalid dataset metadata',
                details: validation.error.flatten()
            });
        }
        const updates = validation.data;
        const dataset = datasetManager_1.datasetManager.updateDataset(id, updates);
        if (!dataset) {
            return res.status(404).json({
                success: false,
                error: 'Dataset not found',
                message: `Dataset with ID ${id} does not exist`
            });
        }
        return res.json({
            success: true,
            data: dataset,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'update_dataset_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to update dataset',
            message: error.message
        });
    }
});
// Delete dataset
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const success = datasetManager_1.datasetManager.deleteDataset(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Dataset not found',
                message: `Dataset with ID ${id} does not exist`
            });
        }
        return res.json({
            success: true,
            message: 'Dataset deleted successfully',
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'delete_dataset_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to delete dataset',
            message: error.message
        });
    }
});
// Create dataset version
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
        const datasetVersion = datasetManager_1.datasetManager.createVersion(id, version, changes);
        if (!datasetVersion) {
            return res.status(404).json({
                success: false,
                error: 'Dataset not found',
                message: `Dataset with ID ${id} does not exist`
            });
        }
        return res.status(201).json({
            success: true,
            data: datasetVersion,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'create_dataset_version_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to create dataset version',
            message: error.message
        });
    }
});
// Validate dataset
router.post('/:id/validate', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const validation = datasetManager_1.datasetManager.validateDataset(id);
        return res.json({
            success: true,
            data: validation,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'validate_dataset_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to validate dataset',
            message: error.message
        });
    }
});
// Export dataset
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
        const success = datasetManager_1.datasetManager.exportDataset(id, targetPath);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Dataset not found',
                message: `Dataset with ID ${id} does not exist`
            });
        }
        return res.json({
            success: true,
            message: 'Dataset exported successfully',
            data: { targetPath },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'export_dataset_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to export dataset',
            message: error.message
        });
    }
});
// Get dataset statistics
router.get('/stats/overview', auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = datasetManager_1.datasetManager.getStats();
        return res.json({
            success: true,
            data: stats,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_dataset_stats_failed', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve dataset statistics',
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
            service: 'dataset-management',
            timestamp: new Date().toISOString()
        }
    });
});
exports.default = router;
//# sourceMappingURL=datasets.js.map