"use strict";
/**
 * Text-to-Speech (TTS) API Routes
 * Handles text synthesis and audio generation requests
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tts_1 = require("../services/tts");
const logger_1 = require("../middleware/logger");
const zod_1 = require("zod");
const router = express_1.default.Router();
/**
 * POST /api/tts
 * Convert Persian text to speech
 */
router.post('/', async (req, res) => {
    try {
        const startTime = Date.now();
        // Validate request body
        const bodySchema = zod_1.z.object({
            text: zod_1.z.string().min(1).max(1000),
            language: zod_1.z.string().default('fa'),
            voice: zod_1.z.string().default('persian_female'),
            speed: zod_1.z.number().min(0.5).max(2.0).default(1.0),
            pitch: zod_1.z.number().min(0.5).max(2.0).default(1.0),
            format: zod_1.z.enum(['wav', 'ogg', 'mp3']).default('wav'),
            sampleRate: zod_1.z.number().default(16000)
        });
        const validatedBody = bodySchema.parse(req.body);
        logger_1.logger.info({
            msg: 'tts_request_received',
            text: validatedBody.text.substring(0, 50) + '...',
            language: validatedBody.language,
            voice: validatedBody.voice,
            speed: validatedBody.speed,
            pitch: validatedBody.pitch
        });
        // Validate Persian text
        const textValidation = tts_1.ttsService.validatePersianText(validatedBody.text);
        if (!textValidation.valid) {
            logger_1.logger.warn({
                msg: 'tts_persian_text_validation_failed',
                issues: textValidation.issues,
                text: validatedBody.text.substring(0, 50) + '...'
            });
        }
        // Prepare TTS request
        const ttsRequest = {
            text: validatedBody.text,
            language: validatedBody.language,
            voice: validatedBody.voice,
            speed: validatedBody.speed,
            pitch: validatedBody.pitch,
            format: validatedBody.format,
            sampleRate: validatedBody.sampleRate
        };
        // Synthesize speech
        const result = await tts_1.ttsService.synthesize(ttsRequest);
        const processingTime = Date.now() - startTime;
        logger_1.logger.info({
            msg: 'tts_request_completed',
            duration: result.duration,
            voice: result.voice,
            wordCount: result.metadata.wordCount,
            processingTime: processingTime
        });
        res.json({
            error: false,
            data: result,
            processingTime: processingTime
        });
    }
    catch (error) {
        const processingTime = Date.now() - req.startTime || Date.now();
        logger_1.logger.error({
            msg: 'tts_request_failed',
            error: error.message,
            processingTime: processingTime
        });
        res.status(500).json({
            error: true,
            message: error.message,
            code: 'TTS_PROCESSING_ERROR',
            processingTime: processingTime
        });
    }
});
/**
 * POST /api/tts/stream
 * Stream audio response (for real-time playback)
 */
router.post('/stream', async (req, res) => {
    try {
        const startTime = Date.now();
        // Validate request body
        const bodySchema = zod_1.z.object({
            text: zod_1.z.string().min(1).max(1000),
            language: zod_1.z.string().default('fa'),
            voice: zod_1.z.string().default('persian_female'),
            speed: zod_1.z.number().min(0.5).max(2.0).default(1.0),
            pitch: zod_1.z.number().min(0.5).max(2.0).default(1.0),
            format: zod_1.z.enum(['wav', 'ogg', 'mp3']).default('wav'),
            sampleRate: zod_1.z.number().default(16000)
        });
        const validatedBody = bodySchema.parse(req.body);
        logger_1.logger.info({
            msg: 'tts_stream_request_received',
            text: validatedBody.text.substring(0, 50) + '...',
            voice: validatedBody.voice
        });
        // Prepare TTS request
        const ttsRequest = {
            text: validatedBody.text,
            language: validatedBody.language,
            voice: validatedBody.voice,
            speed: validatedBody.speed,
            pitch: validatedBody.pitch,
            format: validatedBody.format,
            sampleRate: validatedBody.sampleRate
        };
        // Synthesize speech
        const result = await tts_1.ttsService.synthesize(ttsRequest);
        const processingTime = Date.now() - startTime;
        // Set headers for audio streaming
        res.setHeader('Content-Type', `audio/${validatedBody.format}`);
        res.setHeader('Content-Length', Buffer.from(result.audio, 'base64').length);
        res.setHeader('X-Audio-Duration', result.duration.toString());
        res.setHeader('X-Processing-Time', processingTime.toString());
        res.setHeader('X-Voice', result.voice);
        res.setHeader('X-Language', result.language);
        // Send audio data
        res.send(Buffer.from(result.audio, 'base64'));
        logger_1.logger.info({
            msg: 'tts_stream_completed',
            duration: result.duration,
            voice: result.voice,
            processingTime: processingTime
        });
    }
    catch (error) {
        const processingTime = Date.now() - req.startTime || Date.now();
        logger_1.logger.error({
            msg: 'tts_stream_failed',
            error: error.message,
            processingTime: processingTime
        });
        res.status(500).json({
            error: true,
            message: error.message,
            code: 'TTS_STREAM_ERROR',
            processingTime: processingTime
        });
    }
});
/**
 * GET /api/tts/voices
 * Get available voices
 */
router.get('/voices', async (_req, res) => {
    try {
        const voices = tts_1.ttsService.getVoices();
        res.json({
            error: false,
            data: {
                voices: voices,
                count: voices.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error({
            msg: 'tts_voices_request_failed',
            error: error.message
        });
        res.status(500).json({
            error: true,
            message: error.message,
            code: 'TTS_VOICES_ERROR'
        });
    }
});
/**
 * GET /api/tts/status
 * Get TTS service status and capabilities
 */
router.get('/status', async (_req, res) => {
    try {
        const status = tts_1.ttsService.getStatus();
        const supportedLanguages = tts_1.ttsService.getSupportedLanguages();
        const supportedFormats = tts_1.ttsService.getSupportedFormats();
        res.json({
            error: false,
            data: {
                status: status,
                capabilities: {
                    supportedLanguages: supportedLanguages,
                    supportedFormats: supportedFormats,
                    maxTextLength: 1000,
                    voicesCount: status.voicesCount
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error({
            msg: 'tts_status_request_failed',
            error: error.message
        });
        res.status(500).json({
            error: true,
            message: error.message,
            code: 'TTS_STATUS_ERROR'
        });
    }
});
/**
 * GET /api/tts/health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
    res.json({
        error: false,
        status: 'healthy',
        service: 'tts',
        timestamp: new Date().toISOString()
    });
});
/**
 * POST /api/tts/validate
 * Validate Persian text for TTS
 */
router.post('/validate', async (req, res) => {
    try {
        const bodySchema = zod_1.z.object({
            text: zod_1.z.string().min(1).max(1000)
        });
        const validatedBody = bodySchema.parse(req.body);
        const validation = tts_1.ttsService.validatePersianText(validatedBody.text);
        res.json({
            error: false,
            data: {
                text: validatedBody.text,
                validation: validation,
                wordCount: validatedBody.text.split(' ').length,
                characterCount: validatedBody.text.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error({
            msg: 'tts_validate_request_failed',
            error: error.message
        });
        res.status(500).json({
            error: true,
            message: error.message,
            code: 'TTS_VALIDATE_ERROR'
        });
    }
});
exports.default = router;
//# sourceMappingURL=tts.js.map