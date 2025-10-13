// server-monitored.ts - Production-ready server with monitoring
import express from 'express';
import http from 'http';
import cors from 'cors';
import { initSentry } from './config/sentry';
import { httpLogger, requestTimer, detailedRequestLogger } from './middleware/request-logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { trackAnalytics } from './middleware/analytics';
import { systemMonitor } from './monitoring/system';
import healthRouter from './routes/health';
import monitoringRouter from './routes/monitoring';
import trainRouter from './routes/train';
import trainingRouter from './routes/training';
import optimizationRouter from './routes/optimization';
import bootstrapRouter from './routes/bootstrap';
import sourcesRouter from './routes/sources';
import modelsRouter from './routes/models';
import datasetsRouter from './routes/datasets';
import offlineTrainingRouter from './routes/offlineTraining';
import authRouter from './routes/auth';
import chatRouter from './routes/chat';
import sttRouter from './routes/stt';
import ttsRouter from './routes/tts';
import searchRouter from './routes/search';
import notificationsRouter from './routes/notifications';
import experimentsRouter from './routes/experiments';
import settingsRouter from './routes/settings';
import { authenticateToken } from './middleware/auth';
import downloadProxyRouter from './simple-proxy';
import { log } from './config/logger';
import { ENV } from './config/env';
import { setupWebSocket } from './services/websocket.service';
import { setupSwagger } from './swagger';

// Initialize Sentry (before everything)
initSentry();

const app = express();

// Start system monitoring
systemMonitor.start(60000); // Every minute

// Middleware - in correct order
app.use(requestTimer);
app.use(httpLogger);
app.use(trackAnalytics);
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Detailed logging in development
if (ENV.NODE_ENV === 'development') {
  app.use(detailedRequestLogger);
}

// Setup Swagger API documentation
setupSwagger(app);

// Health check routes (public, no auth)
app.use('/health', healthRouter);
app.use('/api/monitoring', monitoringRouter);

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/stt', sttRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/search', searchRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/offline-training', offlineTrainingRouter);
app.use('/api/v1', downloadProxyRouter);

// Protected routes
app.use('/api/chat', authenticateToken, chatRouter);
app.use('/api/training', authenticateToken, trainingRouter);
app.use('/api/train', authenticateToken, trainRouter);
app.use('/api/optimization', authenticateToken, optimizationRouter);
app.use('/api/bootstrap', authenticateToken, bootstrapRouter);
app.use('/api/download', authenticateToken, bootstrapRouter);
app.use('/api/sources', authenticateToken, sourcesRouter);
app.use('/api/models', authenticateToken, modelsRouter);
app.use('/api/notifications', authenticateToken, notificationsRouter);
app.use('/api/experiments', authenticateToken, experimentsRouter);

// Error handlers (MUST be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
const io = setupWebSocket(server);

// Make io available to routes
app.set('io', io);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  log.info(`Received ${signal}, starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    log.info('HTTP server closed');
  });
  
  // Stop system monitoring
  systemMonitor.stop();
  
  // Close database connections
  try {
    const { closeDatabase } = await import('./database/connection');
    await closeDatabase();
    log.info('Database connections closed');
  } catch (error) {
    log.error('Error closing database', { error });
  }
  
  // Close WebSocket
  io.close(() => {
    log.info('WebSocket server closed');
  });
  
  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const port = ENV.PORT || 3001;
server.listen(port, () => {
  log.info(`🚀 Persian TTS Backend listening on port ${port}`);
  log.info(`📊 Health check: http://localhost:${port}/health`);
  log.info(`📈 Monitoring: http://localhost:${port}/api/monitoring/system`);
  log.info(`🔐 Auth endpoint: http://localhost:${port}/api/auth/login`);
  log.info(`💬 Chat endpoint: http://localhost:${port}/api/chat`);
  log.info(`🔌 WebSocket server ready`);
  log.info(`🎯 Environment: ${ENV.NODE_ENV}`);
  log.info(`✅ All services initialized successfully`);
});

export { app, server };
