/**
 * Sources API Routes - HuggingFace integration with real database
 */
import { Router, Request, Response } from 'express';
import { logger } from '../middleware/logger';
import { hfService } from '../services/huggingface.service';
import { downloadManager } from '../services/download-manager.service';
import { query } from '../database/connection';
import { validate } from '../middleware/validation';
import { sourcesSchemas, SearchQuery, DownloadRequest } from '../schemas/sources.schema';

const router = Router();

/**
 * Search models on HuggingFace
 * GET /api/sources/search?q=persian+tts&task=text-to-speech
 */
router.get('/search', validate(sourcesSchemas.search), async (req: Request, res: Response): Promise<void> => {
  try {
    const searchQuery = req.query as unknown as SearchQuery;

    // Get HF token from user settings if available
    const userId = (req as any).user?.id;
    let token: string | undefined;

    if (userId) {
      const settings = await query(
        'SELECT huggingface_token FROM user_settings WHERE user_id = $1',
        [userId]
      );
      token = settings.rows[0]?.huggingface_token;
    }

    const models = await hfService.searchModels(
      searchQuery.q,
      {
        task: searchQuery.task,
        library: searchQuery.library,
        language: searchQuery.language,
        sort: searchQuery.sort
      },
      token
    );

    res.json({
      success: true,
      data: models,
      total: models.length
    });
  } catch (error: any) {
    logger.error({ msg: 'search_models_failed', error: error.message });
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
router.get('/model/:repoId(*)', validate(sourcesSchemas.getModel), async (req: Request, res: Response): Promise<void> => {
  try {
    const repoId = req.params.repoId;

    const userId = (req as any).user?.id;
    let token: string | undefined;

    if (userId) {
      const settings = await query(
        'SELECT huggingface_token FROM user_settings WHERE user_id = $1',
        [userId]
      );
      token = settings.rows[0]?.huggingface_token;
    }

    const modelInfo = await hfService.getModelInfo(repoId, token);

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
  } catch (error: any) {
    logger.error({ msg: 'get_model_info_failed', error: error.message });
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
router.post('/download', validate(sourcesSchemas.startDownload), async (req: Request, res: Response): Promise<void> => {
  try {
    const downloadRequest = req.body as DownloadRequest;
    const userId = (req as any).user?.id || 'default';

    logger.info({
      msg: 'starting_download',
      repoId: downloadRequest.repoId,
      userId,
      hasToken: !!downloadRequest.token
    });

    const downloadId = await downloadManager.startDownload(
      downloadRequest.repoId,
      downloadRequest.repoId,
      userId,
      downloadRequest.token
    );

    res.json({
      success: true,
      data: {
        downloadId,
        repoId: downloadRequest.repoId,
        message: 'Download started successfully'
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'start_download_failed', error: error.message });
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
router.get('/download/:downloadId', validate(sourcesSchemas.getDownload), async (req: Request, res: Response): Promise<void> => {
  try {
    const { downloadId } = req.params;

    const download = await downloadManager.getDownloadStatus(downloadId);

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
  } catch (error: any) {
    logger.error({ msg: 'get_download_status_failed', error: error.message });
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
router.get('/downloads', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'default';

    const downloads = await downloadManager.getUserDownloads(userId);

    res.json({
      success: true,
      data: downloads,
      total: downloads.length
    });
  } catch (error: any) {
    logger.error({ msg: 'get_downloads_failed', error: error.message });
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
router.delete('/download/:downloadId', validate(sourcesSchemas.cancelDownload), async (req: Request, res: Response): Promise<void> => {
  try {
    const { downloadId } = req.params;

    const cancelled = await downloadManager.cancelDownload(downloadId);

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
  } catch (error: any) {
    logger.error({ msg: 'cancel_download_failed', error: error.message });
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
router.get('/installed', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT 
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
       ORDER BY m.updated_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    logger.error({ msg: 'get_installed_models_failed', error: error.message });
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
router.post('/validate-token', validate(sourcesSchemas.validateToken), async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    const validation = await hfService.validateToken(token);

    res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    logger.error({ msg: 'validate_token_failed', error: error.message });
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
router.get('/persian/tts', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    let token: string | undefined;

    if (userId) {
      const settings = await query(
        'SELECT huggingface_token FROM user_settings WHERE user_id = $1',
        [userId]
      );
      token = settings.rows[0]?.huggingface_token;
    }

    const models = await hfService.searchPersianTTS(token);

    res.json({
      success: true,
      data: models,
      total: models.length
    });
  } catch (error: any) {
    logger.error({ msg: 'search_persian_tts_failed', error: error.message });
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
router.get('/persian/stt', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    let token: string | undefined;

    if (userId) {
      const settings = await query(
        'SELECT huggingface_token FROM user_settings WHERE user_id = $1',
        [userId]
      );
      token = settings.rows[0]?.huggingface_token;
    }

    const models = await hfService.searchPersianSTT(token);

    res.json({
      success: true,
      data: models,
      total: models.length
    });
  } catch (error: any) {
    logger.error({ msg: 'search_persian_stt_failed', error: error.message });
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
router.get('/persian/llm', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    let token: string | undefined;

    if (userId) {
      const settings = await query(
        'SELECT huggingface_token FROM user_settings WHERE user_id = $1',
        [userId]
      );
      token = settings.rows[0]?.huggingface_token;
    }

    const models = await hfService.searchPersianLLM(token);

    res.json({
      success: true,
      data: models,
      total: models.length
    });
  } catch (error: any) {
    logger.error({ msg: 'search_persian_llm_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Legacy compatibility endpoints
router.get('/catalog', async (_req: Request, res: Response): Promise<void> => {
  res.redirect('/api/sources/search?q=persian');
});

export default router;
