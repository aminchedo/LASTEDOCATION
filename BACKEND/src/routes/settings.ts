import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory storage (replace with DB in production)
const userSettings = new Map<string, any>();

// Get user settings
router.get('/', (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user?.id || 'default';
    const settings = userSettings.get(userId) || {};
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

// Save user settings
router.post('/', (req: Request, res: Response): void => {
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

    userSettings.set(userId, settings);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// Validate HuggingFace token
router.put('/huggingface/validate', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ success: false, error: 'Token required' });
    return;
  }

  if (!token.startsWith('hf_')) {
    res.status(400).json({ 
      success: false, 
      error: 'Invalid token format. Token must start with hf_' 
    });
    return;
  }

  try {
    // Test token by calling HF API
    const response = await fetch('https://huggingface.co/api/whoami', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      res.json({
        success: true,
        valid: true,
        username: data.name,
        type: data.type
      });
    } else {
      res.json({ success: true, valid: false });
    }
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate token'
    });
  }
});

export default router;
