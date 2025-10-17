/**
 * Main server file with PostgreSQL and WebSocket support
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import path from 'path';
import { ENV } from './config/env';
import { logger } from './middleware/logger';
// Security Middlewares
import { 
  globalErrorHandler, 
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException 
} from './middleware/error-handler';
import { generalLimiter, publicLimiter } from './middleware/rate-limiter';
import { initDatabase, closeDatabase, healthCheck, getDatabaseEngine } from './database/connection-new';
import { initWebSocket } from './services/websocket-real.service';
import apiRouter from './routes/api';
import healthRouter from './routes/health';

const app: Express = express();
const httpServer = createServer(app);

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: ENV.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// HTTP Request Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info({ msg: 'http_request', details: message.trim() });
    }
  },
  skip: (req) => req.path === '/health/live' // Skip health check spam
}));

// Serve static files from public directory (monitoring dashboard)
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting for public endpoints
app.use('/health', publicLimiter);

// Health check routes (before other middlewares)
app.use('/health', healthRouter);

// API routes (with general rate limiting)
app.use('/api', generalLimiter, apiRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
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
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

/**
 * Initialize server
 */
async function initServer() {
  try {
    // Initialize database
    logger.info({ msg: 'initializing_database' });
    await initDatabase();
    logger.info({ msg: 'database_initialized' });

    // Initialize WebSocket
    logger.info({ msg: 'initializing_websocket' });
    const io = initWebSocket(httpServer);
    logger.info({
      msg: 'websocket_initialized',
      path: '/socket.io'
    });

    // Start server
    httpServer.listen(ENV.PORT, () => {
      logger.info({
        msg: 'server_started',
        port: ENV.PORT,
        env: ENV.NODE_ENV,
        pid: process.pid
      });

      const dbEngine = getDatabaseEngine();
      console.log('\n✅ Server started successfully');
      console.log(`📡 HTTP Server: http://localhost:${ENV.PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${ENV.PORT}`);
      console.log(`💾 Database: ${dbEngine === 'sqlite' ? 'SQLite' : 'PostgreSQL'} connected`);
      console.log(`🌍 Environment: ${ENV.NODE_ENV}`);
      console.log('\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info({ msg: 'shutting_down', signal });

      httpServer.close(async () => {
        logger.info({ msg: 'http_server_closed' });

        try {
          await closeDatabase();
          logger.info({ msg: 'database_closed' });
          
          process.exit(0);
        } catch (error: any) {
          logger.error({ msg: 'shutdown_error', error: error.message });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error({ msg: 'forced_shutdown' });
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error: any) {
    logger.error({
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

export { app, httpServer };
