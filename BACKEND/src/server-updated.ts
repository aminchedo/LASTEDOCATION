/**
 * Main server file with PostgreSQL and WebSocket support
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { ENV } from './config/env';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase, closeDatabase, healthCheck } from './database/connection';
import { initWebSocket } from './services/websocket-real.service';
import apiRouter from './routes/api';

const app: Express = express();
const httpServer = createServer(app);

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

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info({ msg: 'http_request', details: message.trim() });
    }
  }
}));

// Health check endpoint (before authentication)
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await healthCheck();
    
    res.json({
      success: true,
      data: {
        status: dbHealthy ? 'healthy' : 'degraded',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'error',
        error: error.message
      }
    });
  }
});

// API routes
app.use('/api', apiRouter);

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

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use(errorHandler);

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

      console.log('\n✅ Server started successfully');
      console.log(`📡 HTTP Server: http://localhost:${ENV.PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${ENV.PORT}`);
      console.log(`💾 Database: PostgreSQL connected`);
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
