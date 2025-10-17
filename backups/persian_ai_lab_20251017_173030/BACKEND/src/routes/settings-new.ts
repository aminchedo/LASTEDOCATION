/**
 * Settings API Routes - User settings with database persistence
 */
import { Router, Request, Response } from 'express';
import { query } from '../database/connection';
import { hfService } from '../services/huggingface.service';
import { logger } from '../middleware/logger';

const router = Router();

/**
 * Get user settings
 * GET /api/settings
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'default';

    const result = await query(
      `SELECT 
        huggingface_token as "huggingfaceToken",
        huggingface_api_url as "huggingfaceApiUrl",
        auto_download as "autoDownload",
        max_concurrent_downloads as "maxConcurrentDownloads",
        settings_json as "settingsJson"
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default settings
      res.json({
        success: true,
        data: {
          huggingfaceToken: null,
          huggingfaceApiUrl: 'https://huggingface.co',
          autoDownload: false,
          maxConcurrentDownloads: 2,
          settingsJson: {}
        }
      });
      return;
    }

    const settings = result.rows[0];
    
    // Don't send full token to client, just indicate if it's set
    res.json({
      success: true,
      data: {
        ...settings,
        huggingfaceToken: settings.huggingfaceToken ? '***' : null,
        hasToken: !!settings.huggingfaceToken
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'get_settings_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Save user settings
 * POST /api/settings
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'default';
    const settings = req.body;

    // Validate HuggingFace token format if provided
    if (settings.huggingfaceToken && !settings.huggingfaceToken.startsWith('hf_')) {
      res.status(400).json({
        success: false,
        error: 'Invalid HuggingFace token format. Token must start with hf_'
      });
      return;
    }

    // Upsert settings
    await query(
      `INSERT INTO user_settings (
        user_id,
        huggingface_token,
        huggingface_api_url,
        auto_download,
        max_concurrent_downloads,
        settings_json
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        huggingface_token = COALESCE(EXCLUDED.huggingface_token, user_settings.huggingface_token),
        huggingface_api_url = COALESCE(EXCLUDED.huggingface_api_url, user_settings.huggingface_api_url),
        auto_download = COALESCE(EXCLUDED.auto_download, user_settings.auto_download),
        max_concurrent_downloads = COALESCE(EXCLUDED.max_concurrent_downloads, user_settings.max_concurrent_downloads),
        settings_json = COALESCE(EXCLUDED.settings_json, user_settings.settings_json),
        updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        settings.huggingfaceToken || null,
        settings.huggingfaceApiUrl || 'https://huggingface.co',
        settings.autoDownload ?? false,
        settings.maxConcurrentDownloads ?? 2,
        JSON.stringify(settings.settingsJson || {})
      ]
    );

    logger.info({
      msg: 'settings_saved',
      userId,
      hasToken: !!settings.huggingfaceToken
    });

    res.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error: any) {
    logger.error({ msg: 'save_settings_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate HuggingFace token
 * PUT /api/settings/huggingface/validate
 */
router.put('/huggingface/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required'
      });
      return;
    }

    if (!token.startsWith('hf_')) {
      res.status(400).json({
        success: false,
        error: 'Invalid token format. Token must start with hf_'
      });
      return;
    }

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
 * Update HuggingFace token
 * PUT /api/settings/huggingface/token
 */
router.put('/huggingface/token', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'default';
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required'
      });
      return;
    }

    if (!token.startsWith('hf_')) {
      res.status(400).json({
        success: false,
        error: 'Invalid token format. Token must start with hf_'
      });
      return;
    }

    // Validate token first
    const validation = await hfService.validateToken(token);

    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: 'Token validation failed. Please check your token.'
      });
      return;
    }

    // Save token
    await query(
      `INSERT INTO user_settings (user_id, huggingface_token)
       VALUES ($1, $2)
       ON CONFLICT (user_id) 
       DO UPDATE SET
         huggingface_token = $2,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, token]
    );

    logger.info({
      msg: 'huggingface_token_updated',
      userId,
      username: validation.username
    });

    res.json({
      success: true,
      data: {
        valid: true,
        username: validation.username,
        message: 'Token saved successfully'
      }
    });
  } catch (error: any) {
    logger.error({ msg: 'update_token_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete HuggingFace token
 * DELETE /api/settings/huggingface/token
 */
router.delete('/huggingface/token', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'default';

    await query(
      `UPDATE user_settings
       SET huggingface_token = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [userId]
    );

    logger.info({
      msg: 'huggingface_token_deleted',
      userId
    });

    res.json({
      success: true,
      message: 'Token deleted successfully'
    });
  } catch (error: any) {
    logger.error({ msg: 'delete_token_failed', error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
