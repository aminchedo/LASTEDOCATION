"use strict";
// BACKEND/src/routes/sources.ts - FIXED VERSION
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../middleware/logger");
const downloads_1 = require("../services/downloads");
const modelCatalog_1 = require("../config/modelCatalog");
const router = (0, express_1.Router)();
// ====== GET CATALOG ======
/**
 * GET /api/sources/catalog
 * Get all models from catalog
 */
router.get('/catalog', async (_req, res) => {
    try {
        res.json({
            success: true,
            data: modelCatalog_1.MODEL_CATALOG,
            total: modelCatalog_1.MODEL_CATALOG.length
        });
    }
    catch (error) {
        logger_1.logger.error(`Error getting catalog: ${error.message}`);
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
router.get('/catalog/:id', async (req, res) => {
    try {
        const modelId = decodeURIComponent(req.params.id);
        const model = (0, modelCatalog_1.getModelById)(modelId);
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
    }
    catch (error) {
        logger_1.logger.error(`Error getting model: ${error.message}`);
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
router.get('/catalog/type/:type', async (req, res) => {
    try {
        const type = req.params.type;
        if (!['model', 'tts', 'dataset'].includes(type)) {
            res.status(400).json({
                success: false,
                error: 'Invalid type. Must be: model, tts, or dataset'
            });
            return;
        }
        const models = (0, modelCatalog_1.getModelsByType)(type);
        res.json({
            success: true,
            data: models,
            total: models.length,
            type
        });
    }
    catch (error) {
        logger_1.logger.error(`Error getting models by type: ${error.message}`);
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
router.get('/catalog/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            res.status(400).json({
                success: false,
                error: 'Missing search query parameter: q'
            });
            return;
        }
        const results = (0, modelCatalog_1.searchModels)(query);
        res.json({
            success: true,
            data: results,
            total: results.length,
            query
        });
    }
    catch (error) {
        logger_1.logger.error(`Error searching catalog: ${error.message}`);
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
router.post('/download', async (req, res) => {
    try {
        const { modelId, destination } = req.body;
        if (!modelId) {
            res.status(400).json({
                success: false,
                error: 'modelId is required'
            });
            return;
        }
        // Get model from catalog
        const model = (0, modelCatalog_1.getModelById)(modelId);
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
        logger_1.logger.info({
            msg: 'Starting model download from catalog',
            modelId,
            dest
        });
        // Start download
        const job = await (0, downloads_1.startDownload)(model.type, model.id, model.repoType, dest);
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
    }
    catch (error) {
        logger_1.logger.error(`Error starting download: ${error.message}`);
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
router.get('/downloads', async (_req, res) => {
    try {
        const downloads = (0, downloads_1.getAllDownloadJobs)();
        res.json({
            success: true,
            data: downloads,
            total: downloads.length
        });
    }
    catch (error) {
        logger_1.logger.error(`Error getting downloads: ${error.message}`);
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
router.get('/download/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = (0, downloads_1.getDownloadJob)(jobId);
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
    }
    catch (error) {
        logger_1.logger.error(`Error getting download status: ${error.message}`);
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
router.delete('/download/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const cancelled = (0, downloads_1.cancelDownload)(jobId);
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
    }
    catch (error) {
        logger_1.logger.error(`Error cancelling download: ${error.message}`);
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
router.get('/models/available', async (_req, res) => {
    try {
        const models = (0, modelCatalog_1.getModelsByType)('model');
        res.json({
            success: true,
            data: models
        });
    }
    catch (error) {
        logger_1.logger.error(`Error getting available models: ${error.message}`);
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
router.get('/datasets/available', async (_req, res) => {
    try {
        const datasets = (0, modelCatalog_1.getModelsByType)('dataset');
        res.json({
            success: true,
            data: datasets
        });
    }
    catch (error) {
        logger_1.logger.error(`Error getting available datasets: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/sources/installed
 * Get installed sources (mock for now)
 */
router.get('/installed', async (_req, res) => {
    try {
        // This would scan the actual filesystem in production
        const sources = [
            {
                id: 'source_1',
                name: 'Hugging Face',
                type: 'model_repository',
                installed: true,
                version: '2.0.1',
                lastUpdated: new Date().toISOString()
            }
        ];
        res.json({
            ok: true,
            sources
        });
    }
    catch (error) {
        logger_1.logger.error(`Error getting installed sources: ${error.message}`);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=sources.js.map