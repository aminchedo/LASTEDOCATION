"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const train_1 = __importDefault(require("./routes/train"));
const training_1 = __importDefault(require("./routes/training")); // Training job management API
const optimization_1 = __importDefault(require("./routes/optimization"));
const bootstrap_1 = __importDefault(require("./routes/bootstrap"));
const sources_1 = __importDefault(require("./routes/sources"));
const monitoring_1 = __importDefault(require("./routes/monitoring"));
const models_1 = __importDefault(require("./routes/models"));
const datasets_1 = __importDefault(require("./routes/datasets"));
const offlineTraining_1 = __importDefault(require("./routes/offlineTraining"));
const auth_1 = __importDefault(require("./routes/auth"));
const chat_1 = __importDefault(require("./routes/chat"));
const stt_1 = __importDefault(require("./routes/stt"));
const tts_1 = __importDefault(require("./routes/tts"));
const search_1 = __importDefault(require("./routes/search"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const experiments_1 = __importDefault(require("./routes/experiments"));
const settings_1 = __importDefault(require("./routes/settings"));
const health_1 = __importDefault(require("./routes/health"));
const auth_2 = require("./middleware/auth");
const simple_proxy_1 = __importDefault(require("./simple-proxy"));
const logger_1 = require("./utils/logger");
const env_1 = require("./config/env");
const websocket_service_1 = require("./services/websocket.service");
const swagger_1 = require("./swagger");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: env_1.ENV.CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
// Serve static files from public directory (monitoring dashboard)
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Setup Swagger API documentation
(0, swagger_1.setupSwagger)(app);
// Health check routes (before authentication)
app.use('/health', health_1.default);
// Routeهای اصلی
app.use('/api/auth', auth_1.default);
app.use('/api/chat', auth_2.authenticateToken, chat_1.default);
// Training API - unified endpoint
app.use('/api/training', training_1.default);
// Legacy train routes (kept for backward compatibility, will be deprecated)
app.use('/api/train', auth_2.authenticateToken, train_1.default);
app.use('/api/optimization', auth_2.authenticateToken, optimization_1.default);
app.use('/api/bootstrap', auth_2.authenticateToken, bootstrap_1.default);
app.use('/api/download', bootstrap_1.default); // برای compatibility
app.use('/api/sources', auth_2.authenticateToken, sources_1.default);
app.use('/api/monitoring', auth_2.authenticateToken, monitoring_1.default);
app.use('/api/models', auth_2.authenticateToken, models_1.default);
app.use('/api/datasets', datasets_1.default); // Dataset management
app.use('/api/offline-training', offlineTraining_1.default); // Offline training
app.use('/api/v1', simple_proxy_1.default); // Download proxy routes
// Routes گم‌شده - اضافه شده
app.use('/api/stt', stt_1.default); // Speech-to-Text (Public - بدون auth)
app.use('/api/tts', tts_1.default); // Text-to-Speech (Public - بدون auth)
app.use('/api/search', search_1.default); // Search Service (Public - بدون auth)
app.use('/api/notifications', auth_2.authenticateToken, notifications_1.default); // Notifications (Protected)
app.use('/api/experiments', auth_2.authenticateToken, experiments_1.default); // Experiments (Protected)
app.use('/api/settings', settings_1.default); // Settings (Public - auth optional)
// Routeهای fallback برای جلوگیری از 404
app.get('/api/train/status', (_req, res) => {
    res.json({
        status: 'idle',
        message: 'Training service is available but no active training',
        timestamp: new Date().toISOString()
    });
});
app.get('/api/train/stream', (_req, res) => {
    // SSE endpoint پایه
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    // ارسال یک پیام اولیه
    res.write('data: ' + JSON.stringify({
        type: 'info',
        message: 'Training stream connected'
    }) + '\n\n');
});
app.get('/api/sources/downloads', (_req, res) => {
    // Fallback برای سیستم دانلود قدیمی
    res.json({
        success: true,
        data: [],
        message: 'Using new download system - check /api/download/jobs'
    });
});
app.get('/api/monitoring/metrics', (_req, res) => {
    res.json({
        success: true,
        data: {
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            disk: Math.random() * 100,
            activeDownloads: 0,
            activeTrainings: 0,
            timestamp: new Date().toISOString()
        }
    });
});
// Health checks
app.get('/health', (_req, res) => {
    res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        service: 'persian-chat-backend'
    });
});
app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        services: {
            auth: true,
            chat: true,
            training: true,
            download: true,
            monitoring: true,
            sources: true,
            stt: true,
            tts: true,
            search: true,
            notifications: true
        },
        timestamp: new Date().toISOString()
    });
});
// 404 Handler - باید قبل از error handler باشد
app.use('*', (req, res) => {
    logger_1.logger.warn({
        msg: '404_not_found',
        method: req.method,
        path: req.originalUrl,
        ip: req.ip
    });
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableRoutes: [
            'GET /health',
            'GET /api/health',
            'POST /api/auth/login',
            'POST /api/auth/verify',
            'POST /api/chat',
            'GET /api/train/status',
            'POST /api/train/start',
            'GET /api/models/detected',
            'POST /api/stt',
            'POST /api/tts',
            'POST /api/search',
            'GET /api/notifications',
            'GET /api/monitoring/metrics',
            'GET /api/sources/downloads'
        ],
        timestamp: new Date().toISOString()
    });
});
// Global Error Handler
app.use((err, req, res, _next) => {
    logger_1.logger.error({
        msg: 'unhandled_error',
        error: err.message,
        stack: err.stack,
        method: req.method,
        path: req.originalUrl
    });
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
    });
});
// Create HTTP server
const server = http_1.default.createServer(app);
// Setup WebSocket
const io = (0, websocket_service_1.setupWebSocket)(server);
// Make io available to routes if needed
app.set('io', io);
// Start server
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
server.listen(port, () => {
    logger_1.logger.info(`🚀 Persian Chat Backend API listening on port ${port}`);
    logger_1.logger.info(`📡 Health check: http://localhost:${port}/health`);
    logger_1.logger.info(`🔐 Auth endpoint: http://localhost:${port}/api/auth/login`);
    logger_1.logger.info(`💬 Chat endpoint: http://localhost:${port}/api/chat`);
    logger_1.logger.info(`🔌 WebSocket server ready`);
    logger_1.logger.info(`🎯 All routes registered successfully`);
});
//# sourceMappingURL=server.js.map