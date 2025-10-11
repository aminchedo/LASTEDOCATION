"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const modelDetection_1 = require("../services/modelDetection");
const logger_1 = require("../middleware/logger");
const router = (0, express_1.Router)();
const modelDetectionService = new modelDetection_1.ModelDetectionService();
/**
 * GET /api/models/scan
 * Scan specified directories for models
 */
router.post('/scan', async (req, res) => {
    try {
        const { folders = [], maxDepth = 3, includeHidden = false, minSizeBytes = 1024 * 1024 // 1MB default
         } = req.body;
        if (!Array.isArray(folders) || folders.length === 0) {
            return res.status(400).json({
                error: 'folders array is required and must not be empty'
            });
        }
        logger_1.logger.info(`Scanning ${folders.length} folders for models...`);
        const options = {
            folders,
            maxDepth,
            includeHidden,
            minSizeBytes
        };
        const models = await modelDetectionService.scanForModels(options);
        logger_1.logger.info(`Found ${models.length} models in scan`);
        return res.json({
            success: true,
            models,
            scanned_folders: folders,
            total_found: models.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error scanning for models:', error);
        return res.status(500).json({
            error: 'Failed to scan for models',
            details: error.message
        });
    }
});
/**
 * GET /api/models/default-directories
 * Get default directories that should be scanned for models
 */
router.get('/default-directories', async (_req, res) => {
    try {
        const directories = modelDetection_1.ModelDetectionService.getDefaultModelDirectories();
        return res.json({
            success: true,
            directories,
            count: directories.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting default directories:', error);
        return res.status(500).json({
            error: 'Failed to get default directories',
            details: error.message
        });
    }
});
/**
 * POST /api/models/analyze-directory
 * Analyze a specific directory to check if it contains models
 */
router.post('/analyze-directory', async (req, res) => {
    try {
        const { path: dirPath } = req.body;
        if (!dirPath || typeof dirPath !== 'string') {
            return res.status(400).json({
                error: 'directory path is required'
            });
        }
        const options = {
            folders: [dirPath],
            maxDepth: 1, // Only scan the specified directory
            includeHidden: false,
            minSizeBytes: 0 // Allow small files for analysis
        };
        const models = await modelDetectionService.scanForModels(options);
        return res.json({
            success: true,
            path: dirPath,
            is_model_directory: models.length > 0,
            models,
            model_count: models.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error analyzing directory:', error);
        return res.status(500).json({
            error: 'Failed to analyze directory',
            details: error.message
        });
    }
});
/**
 * GET /api/models/detected
 * Get all detected models from configured directories
 * This endpoint uses settings from the frontend to determine which directories to scan
 */
router.get('/detected', async (req, res) => {
    try {
        // Get scan configuration from query parameters or use defaults
        const customFolders = req.query.customFolders ?
            (typeof req.query.customFolders === 'string' ?
                JSON.parse(req.query.customFolders) :
                req.query.customFolders) : [];
        const scanDepth = parseInt(req.query.scanDepth) || 2;
        const autoScan = req.query.autoScan !== 'false'; // Default true
        let foldersToScan = [];
        if (autoScan) {
            // Include default directories
            const defaultDirs = modelDetection_1.ModelDetectionService.getDefaultModelDirectories();
            foldersToScan.push(...defaultDirs);
        }
        // Add custom folders
        if (Array.isArray(customFolders)) {
            foldersToScan.push(...customFolders);
        }
        // Remove duplicates
        foldersToScan = [...new Set(foldersToScan)];
        if (foldersToScan.length === 0) {
            return res.json({
                success: true,
                models: [],
                message: 'No directories configured for scanning'
            });
        }
        const options = {
            folders: foldersToScan,
            maxDepth: scanDepth,
            includeHidden: false,
            minSizeBytes: 1024 * 1024 // 1MB minimum
        };
        const models = await modelDetectionService.scanForModels(options);
        logger_1.logger.info(`Detected ${models.length} models from ${foldersToScan.length} directories`);
        return res.json({
            success: true,
            models,
            scanned_directories: foldersToScan,
            configuration: {
                customFolders,
                scanDepth,
                autoScan
            },
            statistics: {
                total_models: models.length,
                by_type: {
                    model: models.filter(m => m.type === 'model').length,
                    tts: models.filter(m => m.type === 'tts').length,
                    dataset: models.filter(m => m.type === 'dataset').length,
                    unknown: models.filter(m => m.type === 'unknown').length
                },
                by_format: {
                    pytorch: models.filter(m => m.modelFormat === 'pytorch').length,
                    onnx: models.filter(m => m.modelFormat === 'onnx').length,
                    safetensors: models.filter(m => m.modelFormat === 'safetensors').length,
                    gguf: models.filter(m => m.modelFormat === 'gguf').length,
                    bin: models.filter(m => m.modelFormat === 'bin').length,
                    other: models.filter(m => !['pytorch', 'onnx', 'safetensors', 'gguf', 'bin'].includes(m.modelFormat)).length
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting detected models:', error);
        return res.status(500).json({
            error: 'Failed to get detected models',
            details: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=models.js.map