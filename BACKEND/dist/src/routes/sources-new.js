"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Sources API Routes - HuggingFace integration with real database
 */
const express_1 = require("express");
const logger_1 = require("../middleware/logger");
const huggingface_service_1 = require("../services/huggingface.service");
const download_manager_service_1 = require("../services/download-manager.service");
const connection_1 = require("../database/connection");
const validation_1 = require("../middleware/validation");
const sources_schema_1 = require("../schemas/sources.schema");
const router = (0, express_1.Router)();
/**
 * Search models on HuggingFace
 * GET /api/sources/search?q=persian+tts&task=text-to-speech
 */
router.get('/search', (0, validation_1.validate)(sources_schema_1.sourcesSchemas.search), async (req, res) => {
    try {
        const searchQuery = req.query;
        // Get HF token from user settings if available
        const userId = req.user?.id;
        let token;
        if (userId) {
            const settings = await (0, connection_1.query)('SELECT huggingface_token FROM user_settings WHERE user_id = $1', [userId]);
            token = settings.rows[0]?.huggingface_token;
        }
        const models = await huggingface_service_1.hfService.searchModels(searchQuery.q, {
            task: searchQuery.task,
            library: searchQuery.library,
            language: searchQuery.language,
            sort: searchQuery.sort
        }, token);
        res.json({
            success: true,
            data: models,
            total: models.length
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'search_models_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get model info from HuggingFace
 * GET /api/sources/model/:repoId
 */
router.get('/model/:repoId(*)', (0, validation_1.validate)(sources_schema_1.sourcesSchemas.getModel), async (req, res) => {
    try {
        const repoId = req.params.repoId;
        const userId = req.user?.id;
        let token;
        if (userId) {
            const settings = await (0, connection_1.query)('SELECT huggingface_token FROM user_settings WHERE user_id = $1', [userId]);
            token = settings.rows[0]?.huggingface_token;
        }
        const modelInfo = await huggingface_service_1.hfService.getModelInfo(repoId, token);
        if (!modelInfo) {
            res.status(404).json({
                success: false,
                error: 'Model not found on HuggingFace'
            });
            return;
        }
        res.json({
            success: true,
            data: modelInfo
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_model_info_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Start model download
 * POST /api/sources/download
 * Body: { repoId: string, token?: string }
 */
router.post('/download', (0, validation_1.validate)(sources_schema_1.sourcesSchemas.startDownload), async (req, res) => {
    try {
        const downloadRequest = req.body;
        const userId = req.user?.id || 'default';
        logger_1.logger.info({
            msg: 'starting_download',
            repoId: downloadRequest.repoId,
            userId,
            hasToken: !!downloadRequest.token
        });
        const downloadId = await download_manager_service_1.downloadManager.startDownload(downloadRequest.repoId, downloadRequest.repoId, userId, downloadRequest.token);
        res.json({
            success: true,
            data: {
                downloadId,
                repoId: downloadRequest.repoId,
                message: 'Download started successfully'
            }
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'start_download_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get download status
 * GET /api/sources/download/:downloadId
 */
router.get('/download/:downloadId', (0, validation_1.validate)(sources_schema_1.sourcesSchemas.getDownload), async (req, res) => {
    try {
        const { downloadId } = req.params;
        const download = await download_manager_service_1.downloadManager.getDownloadStatus(downloadId);
        if (!download) {
            res.status(404).json({
                success: false,
                error: 'Download not found'
            });
            return;
        }
        res.json({
            success: true,
            data: download
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_download_status_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get user's downloads
 * GET /api/sources/downloads
 */
router.get('/downloads', async (req, res) => {
    try {
        const userId = req.user?.id || 'default';
        const downloads = await download_manager_service_1.downloadManager.getUserDownloads(userId);
        res.json({
            success: true,
            data: downloads,
            total: downloads.length
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_downloads_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Cancel download
 * DELETE /api/sources/download/:downloadId
 */
router.delete('/download/:downloadId', (0, validation_1.validate)(sources_schema_1.sourcesSchemas.cancelDownload), async (req, res) => {
    try {
        const { downloadId } = req.params;
        const cancelled = await download_manager_service_1.downloadManager.cancelDownload(downloadId);
        if (!cancelled) {
            res.status(404).json({
                success: false,
                error: 'Download not found or already completed'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Download cancelled'
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'cancel_download_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get installed models from database
 * GET /api/sources/installed
 */
router.get('/installed', async (req, res) => {
    try {
        const result = await (0, connection_1.query)(`SELECT 
        m.id,
        m.name,
        m.type,
        m.repo_id as "repoId",
        m.size_mb as "sizeMb",
        m.file_path as "filePath",
        m.metadata,
        m.status,
        m.updated_at as "updatedAt"
       FROM models m
       WHERE m.status = 'installed'
       ORDER BY m.updated_at DESC`);
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'get_installed_models_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Validate HuggingFace token
 * POST /api/sources/validate-token
 * Body: { token: string }
 */
router.post('/validate-token', (0, validation_1.validate)(sources_schema_1.sourcesSchemas.validateToken), async (req, res) => {
    try {
        const { token } = req.body;
        const validation = await huggingface_service_1.hfService.validateToken(token);
        res.json({
            success: true,
            data: validation
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'validate_token_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Search Persian TTS models
 * GET /api/sources/persian/tts
 */
router.get('/persian/tts', async (req, res) => {
    try {
        const userId = req.user?.id;
        let token;
        if (userId) {
            const settings = await (0, connection_1.query)('SELECT huggingface_token FROM user_settings WHERE user_id = $1', [userId]);
            token = settings.rows[0]?.huggingface_token;
        }
        const models = await huggingface_service_1.hfService.searchPersianTTS(token);
        res.json({
            success: true,
            data: models,
            total: models.length
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'search_persian_tts_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Search Persian STT models
 * GET /api/sources/persian/stt
 */
router.get('/persian/stt', async (req, res) => {
    try {
        const userId = req.user?.id;
        let token;
        if (userId) {
            const settings = await (0, connection_1.query)('SELECT huggingface_token FROM user_settings WHERE user_id = $1', [userId]);
            token = settings.rows[0]?.huggingface_token;
        }
        const models = await huggingface_service_1.hfService.searchPersianSTT(token);
        res.json({
            success: true,
            data: models,
            total: models.length
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'search_persian_stt_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Search Persian LLM models
 * GET /api/sources/persian/llm
 */
router.get('/persian/llm', async (req, res) => {
    try {
        const userId = req.user?.id;
        let token;
        if (userId) {
            const settings = await (0, connection_1.query)('SELECT huggingface_token FROM user_settings WHERE user_id = $1', [userId]);
            token = settings.rows[0]?.huggingface_token;
        }
        const models = await huggingface_service_1.hfService.searchPersianLLM(token);
        res.json({
            success: true,
            data: models,
            total: models.length
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'search_persian_llm_failed', error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Legacy compatibility endpoints
router.get('/catalog', async (_req, res) => {
    res.redirect('/api/sources/search?q=persian');
});
exports.default = router;
//# sourceMappingURL=sources-new.js.map