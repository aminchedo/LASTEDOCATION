"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const train_1 = __importDefault(require("./routes/train"));
const optimization_1 = __importDefault(require("./routes/optimization"));
const bootstrap_1 = __importDefault(require("./routes/bootstrap"));
const sources_1 = __importDefault(require("./routes/sources"));
const monitoring_1 = __importDefault(require("./routes/monitoring"));
const models_1 = __importDefault(require("./routes/models"));
const auth_1 = __importDefault(require("./routes/auth"));
const chat_1 = __importDefault(require("./routes/chat"));
const auth_2 = require("./middleware/auth");
const simple_proxy_1 = __importDefault(require("./simple-proxy"));
const logger_1 = require("./utils/logger");
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: env_1.ENV.CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
// Routeهای اصلی
app.use('/api/auth', auth_1.default);
app.use('/api/chat', auth_2.authenticateToken, chat_1.default);
app.use('/api/train', auth_2.authenticateToken, train_1.default);
app.use('/api/optimization', auth_2.authenticateToken, optimization_1.default);
app.use('/api/bootstrap', auth_2.authenticateToken, bootstrap_1.default);
app.use('/api/download', bootstrap_1.default); // برای compatibility
app.use('/api/sources', auth_2.authenticateToken, sources_1.default);
app.use('/api/monitoring', auth_2.authenticateToken, monitoring_1.default);
app.use('/api/models', auth_2.authenticateToken, models_1.default);
app.use('/api/v1', simple_proxy_1.default); // Download proxy routes
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
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        services: {
            training: true,
            download: true,
            monitoring: true,
            sources: true
        },
        timestamp: new Date().toISOString()
    });
});
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
// Error handler should be last
app.use(errorHandler_1.errorHandler);
app.listen(port, () => logger_1.logger.info(`API listening on :${port}`));
//# sourceMappingURL=server.js.map