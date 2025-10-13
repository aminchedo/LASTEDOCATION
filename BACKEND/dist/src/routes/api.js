"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Main API router - aggregates all routes with rate limiting
 */
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const models_1 = __importDefault(require("./models"));
const sources_new_1 = __importDefault(require("./sources-new"));
const training_new_1 = __importDefault(require("./training-new"));
const datasets_1 = __importDefault(require("./datasets"));
const settings_new_1 = __importDefault(require("./settings-new"));
const auth_2 = require("../middleware/auth");
const rate_limiter_1 = require("../middleware/rate-limiter");
const router = (0, express_1.Router)();
// Public routes (with strict rate limiting)
router.use('/auth', rate_limiter_1.authLimiter, auth_1.default);
// Protected routes (require authentication + specific rate limits)
router.use('/models', auth_2.authenticateToken, models_1.default);
// Sources with search rate limiting
router.use('/sources/search', auth_2.authenticateToken, rate_limiter_1.searchLimiter);
router.use('/sources', auth_2.authenticateToken, sources_new_1.default);
// Training with strict rate limiting
router.use('/training', auth_2.authenticateToken, rate_limiter_1.trainingLimiter, training_new_1.default);
// Datasets
router.use('/datasets', auth_2.authenticateToken, datasets_1.default);
// Settings with moderate rate limiting
router.use('/settings', auth_2.authenticateToken, rate_limiter_1.settingsLimiter, settings_new_1.default);
// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        }
    });
});
// API info
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Persian TTS/AI Platform API',
            version: '1.0.0',
            endpoints: {
                auth: '/api/auth',
                models: '/api/models',
                sources: '/api/sources',
                training: '/api/training',
                datasets: '/api/datasets',
                settings: '/api/settings',
                health: '/api/health'
            }
        }
    });
});
exports.default = router;
//# sourceMappingURL=api.js.map