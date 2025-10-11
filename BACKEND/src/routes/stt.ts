/**
 * Speech-to-Text (STT) API Routes
 * Handles audio upload and transcription requests
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sttService } from '../services/stt';
import { logger } from '../middleware/logger';
import { z } from 'zod';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  dest: path.join(process.cwd(), 'uploads', 'audio'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (10MB)
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    // Accept audio files
    const allowedMimes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/mpeg',
      'audio/mp3'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // استفاده از null به جای undefined برای خطا در TypeScript
      cb(new Error('Invalid audio file type. Supported: WAV, OGG, MP3') as any, false); 
    }
  }
});

/**
 * POST /api/stt
 * Transcribe audio file to Persian text from a multipart form upload.
 */
router.post('/', upload.single('audio'), async (req, res) => {
  const startTime = Date.now(); // تعریف زمان شروع در اینجا

  try {
    // Validate request body
    const bodySchema = z.object({
      language: z.string().default('fa'),
      format: z.enum(['wav', 'ogg', 'mp3']).default('wav'),
      sampleRate: z.coerce.number().default(16000) // استفاده از coerce برای اطمینان از تبدیل به عدد
    });
    
    const validatedBody = bodySchema.parse(req.body);
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No audio file provided',
        code: 'MISSING_AUDIO_FILE'
      });
    }
    
    logger.info({
      msg: 'stt_request_received',
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      language: validatedBody.language
    });
    
    // Prepare STT request
    const sttRequest = {
      audioFile: req.file.path,
      language: validatedBody.language,
      format: validatedBody.format,
      sampleRate: validatedBody.sampleRate
    };
    
    // Transcribe audio
    const result = await sttService.transcribe(sttRequest);
    
    const processingTime = Date.now() - startTime;
    
    // Clean up uploaded file - استفاده از async unlink برای عدم مسدود کردن Event Loop
    try {
      await fs.promises.unlink(req.file.path);
    } catch (error) {
      logger.warn({ msg: 'failed_to_cleanup_audio_file', path: req.file.path, error: error instanceof Error ? error.message : 'Unknown' });
    }
    
    logger.info({
      msg: 'stt_request_completed',
      text: result.text,
      confidence: result.confidence,
      duration: result.duration,
      processingTime: processingTime
    });
    
    return res.json({
      error: false,
      data: result,
      processingTime: processingTime
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime; // استفاده از startTime تعریف شده
    
    logger.error({
      msg: 'stt_request_failed',
      error: error.message,
      processingTime: processingTime
    });
    
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        logger.warn({ msg: 'failed_to_cleanup_audio_file_on_error', path: req.file.path, error: cleanupError instanceof Error ? cleanupError.message : 'Unknown' });
      }
    }
    
    // اگر خطای Zod باشد، کد 400 برگردانده شود.
    const statusCode = error.name === 'ZodError' ? 400 : 500;

    return res.status(statusCode).json({
      error: true,
      message: error.message,
      code: 'STT_PROCESSING_ERROR',
      processingTime: processingTime
    });
  }
});

/**
 * POST /api/stt/base64
 * Transcribe base64 encoded audio to Persian text.
 */
router.post('/base64', async (req, res) => {
  const startTime = Date.now(); // تعریف زمان شروع در اینجا
  
  try {
    // Validate request body
    const bodySchema = z.object({
      audio: z.string().min(1).describe('Base64 encoded audio string'),
      language: z.string().default('fa'),
      format: z.enum(['wav', 'ogg', 'mp3']).default('wav'),
      sampleRate: z.coerce.number().default(16000)
    });
    
    const validatedBody = bodySchema.parse(req.body);
    
    logger.info({
      msg: 'stt_base64_request_received',
      audioLength: validatedBody.audio.length,
      language: validatedBody.language
    });
    
    // Prepare STT request
    const sttRequest = {
      audio: validatedBody.audio,
      language: validatedBody.language,
      format: validatedBody.format,
      sampleRate: validatedBody.sampleRate
    };
    
    // Transcribe audio
    const result = await sttService.transcribe(sttRequest);
    
    const processingTime = Date.now() - startTime;
    
    logger.info({
      msg: 'stt_base64_request_completed',
      text: result.text,
      confidence: result.confidence,
      duration: result.duration,
      processingTime: processingTime
    });
    
    return res.json({
      error: false,
      data: result,
      processingTime: processingTime
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime; // استفاده از startTime تعریف شده
    
    logger.error({
      msg: 'stt_base64_request_failed',
      error: error.message,
      processingTime: processingTime
    });

    // اگر خطای Zod باشد، کد 400 برگردانده شود.
    const statusCode = error.name === 'ZodError' ? 400 : 500;
    
    return res.status(statusCode).json({
      error: true,
      message: error.message,
      code: 'STT_PROCESSING_ERROR',
      processingTime: processingTime
    });
  }
});

/**
 * GET /api/stt/status
 * Get STT service status and capabilities
 */
router.get('/status', async (_req, res) => {
  try {
    const status = sttService.getStatus();
    const supportedLanguages = sttService.getSupportedLanguages();
    const supportedFormats = sttService.getSupportedFormats();
    
    res.json({
      error: false,
      data: {
        status: status,
        capabilities: {
          supportedLanguages: supportedLanguages,
          supportedFormats: supportedFormats,
          maxDuration: 30, // seconds
          maxFileSize: '10MB' // based on multer limit
        }
      }
    });
    
  } catch (error: any) {
    logger.error({
      msg: 'stt_status_request_failed',
      error: error.message
    });
    
    res.status(500).json({
      error: true,
      message: error.message,
      code: 'STT_STATUS_ERROR'
    });
  }
});

/**
 * GET /api/stt/health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  // این یک بررسی سریع برای اطمینان از اجرای سرور API است
  res.json({
    error: false,
    status: 'healthy',
    service: 'stt',
    timestamp: new Date().toISOString()
  });
});

export default router;