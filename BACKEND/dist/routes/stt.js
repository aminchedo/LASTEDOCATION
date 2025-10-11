"use strict";
/**
 * Speech-to-Text (STT) API Routes
 * Handles audio upload and transcription requests
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const stt_1 = require("../services/stt");
const logger_1 = require("../middleware/logger");
const zod_1 = require("zod");
const router = express_1.default.Router();
// Configure multer for audio file uploads
const upload = (0, multer_1.default)({
    dest: path_1.default.join(process.cwd(), 'uploads', 'audio'),
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
        }
        else {
            // استفاده از null به جای undefined برای خطا در TypeScript
            cb(new Error('Invalid audio file type. Supported: WAV, OGG, MP3'), false);
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
        const bodySchema = zod_1.z.object({
            language: zod_1.z.string().default('fa'),
            format: zod_1.z.enum(['wav', 'ogg', 'mp3']).default('wav'),
            sampleRate: zod_1.z.coerce.number().default(16000) // استفاده از coerce برای اطمینان از تبدیل به عدد
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
        logger_1.logger.info({
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
        const result = await stt_1.sttService.transcribe(sttRequest);
        const processingTime = Date.now() - startTime;
        // Clean up uploaded file - استفاده از async unlink برای عدم مسدود کردن Event Loop
        try {
            await fs_1.default.promises.unlink(req.file.path);
        }
        catch (error) {
            logger_1.logger.warn({ msg: 'failed_to_cleanup_audio_file', path: req.file.path, error: error instanceof Error ? error.message : 'Unknown' });
        }
        logger_1.logger.info({
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
    }
    catch (error) {
        const processingTime = Date.now() - startTime; // استفاده از startTime تعریف شده
        logger_1.logger.error({
            msg: 'stt_request_failed',
            error: error.message,
            processingTime: processingTime
        });
        // Clean up uploaded file if it exists
        if (req.file) {
            try {
                await fs_1.default.promises.unlink(req.file.path);
            }
            catch (cleanupError) {
                logger_1.logger.warn({ msg: 'failed_to_cleanup_audio_file_on_error', path: req.file.path, error: cleanupError instanceof Error ? cleanupError.message : 'Unknown' });
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
        const bodySchema = zod_1.z.object({
            audio: zod_1.z.string().min(1).describe('Base64 encoded audio string'),
            language: zod_1.z.string().default('fa'),
            format: zod_1.z.enum(['wav', 'ogg', 'mp3']).default('wav'),
            sampleRate: zod_1.z.coerce.number().default(16000)
        });
        const validatedBody = bodySchema.parse(req.body);
        logger_1.logger.info({
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
        const result = await stt_1.sttService.transcribe(sttRequest);
        const processingTime = Date.now() - startTime;
        logger_1.logger.info({
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
    }
    catch (error) {
        const processingTime = Date.now() - startTime; // استفاده از startTime تعریف شده
        logger_1.logger.error({
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
        const status = stt_1.sttService.getStatus();
        const supportedLanguages = stt_1.sttService.getSupportedLanguages();
        const supportedFormats = stt_1.sttService.getSupportedFormats();
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
    }
    catch (error) {
        logger_1.logger.error({
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
exports.default = router;
//# sourceMappingURL=stt.js.map