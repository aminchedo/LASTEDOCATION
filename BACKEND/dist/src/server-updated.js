"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.app = void 0;
/**
 * Main server file with PostgreSQL and WebSocket support
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const env_1 = require("./config/env");
const logger_1 = require("./middleware/logger");
// Security Middlewares
const error_handler_1 = require("./middleware/error-handler");
const rate_limiter_1 = require("./middleware/rate-limiter");
const connection_1 = require("./database/connection");
const websocket_real_service_1 = require("./services/websocket-real.service");
const api_1 = __importDefault(require("./routes/api"));
const health_1 = __importDefault(require("./routes/health"));
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
// Handle uncaught exceptions and unhandled rejections
(0, error_handler_1.handleUncaughtException)();
(0, error_handler_1.handleUnhandledRejection)();
// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use((0, cors_1.default)({
    origin: env_1.ENV.CORS_ORIGIN,
    credentials: true
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// HTTP Request Logging
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => {
            logger_1.logger.info({ msg: 'http_request', details: message.trim() });
        }
    },
    skip: (req) => req.path === '/health/live' // Skip health check spam
}));
// Rate limiting for public endpoints
app.use('/health', rate_limiter_1.publicLimiter);
// Health check routes (before other middlewares)
app.use('/health', health_1.default);
// API routes (with general rate limiting)
app.use('/api', rate_limiter_1.generalLimiter, api_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Persian TTS/AI Platform API',
            version: '1.0.0',
            status: 'running',
            docs: '/api',
            health: '/health'
        }
    });
});
// 404 handler (must be after all routes)
app.use(error_handler_1.notFoundHandler);
// Global error handler (must be last)
app.use(error_handler_1.globalErrorHandler);
/**
 * Initialize server
 */
async function initServer() {
    try {
        // Initialize database
        logger_1.logger.info({ msg: 'initializing_database' });
        await (0, connection_1.initDatabase)();
        logger_1.logger.info({ msg: 'database_initialized' });
        // Initialize WebSocket
        logger_1.logger.info({ msg: 'initializing_websocket' });
        const io = (0, websocket_real_service_1.initWebSocket)(httpServer);
        logger_1.logger.info({
            msg: 'websocket_initialized',
            path: '/socket.io'
        });
        // Start server
        httpServer.listen(env_1.ENV.PORT, () => {
            logger_1.logger.info({
                msg: 'server_started',
                port: env_1.ENV.PORT,
                env: env_1.ENV.NODE_ENV,
                pid: process.pid
            });
            console.log('\n✅ Server started successfully');
            console.log(`📡 HTTP Server: http://localhost:${env_1.ENV.PORT}`);
            console.log(`🔌 WebSocket: ws://localhost:${env_1.ENV.PORT}`);
            console.log(`💾 Database: PostgreSQL connected`);
            console.log(`🌍 Environment: ${env_1.ENV.NODE_ENV}`);
            console.log('\n');
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info({ msg: 'shutting_down', signal });
            httpServer.close(async () => {
                logger_1.logger.info({ msg: 'http_server_closed' });
                try {
                    await (0, connection_1.closeDatabase)();
                    logger_1.logger.info({ msg: 'database_closed' });
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error({ msg: 'shutdown_error', error: error.message });
                    process.exit(1);
                }
            });
            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger_1.logger.error({ msg: 'forced_shutdown' });
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error({
            msg: 'server_initialization_failed',
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}
// Start server
if (require.main === module) {
    initServer();
}
//# sourceMappingURL=server-updated.js.map