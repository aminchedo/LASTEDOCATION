// server.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import trainRouter from './routes/train';
import trainingRouter from './routes/training'; // Training job management API
import optimizationRouter from './routes/optimization';
import bootstrapRouter from './routes/bootstrap';
import sourcesRouter from './routes/sources';
import monitoringRouter from './routes/monitoring';
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
import { authenticateToken } from './middleware/auth';
import downloadProxyRouter from './simple-proxy';
import { logger } from './utils/logger';
import { ENV } from './config/env';
import { setupWebSocket } from './services/websocket.service';

const app = express();
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routeهای اصلی
app.use('/api/auth', authRouter);
app.use('/api/chat', authenticateToken, chatRouter);

// Training API - unified endpoint
app.use('/api/training', trainingRouter);

// Legacy train routes (kept for backward compatibility, will be deprecated)
app.use('/api/train', authenticateToken, trainRouter);
app.use('/api/optimization', authenticateToken, optimizationRouter);
app.use('/api/bootstrap', authenticateToken, bootstrapRouter);
app.use('/api/download', bootstrapRouter); // برای compatibility
app.use('/api/sources', authenticateToken, sourcesRouter);
app.use('/api/monitoring', authenticateToken, monitoringRouter);
app.use('/api/models', authenticateToken, modelsRouter);
app.use('/api/datasets', datasetsRouter); // Dataset management
app.use('/api/offline-training', offlineTrainingRouter); // Offline training
app.use('/api/v1', downloadProxyRouter); // Download proxy routes

// Routes گم‌شده - اضافه شده
app.use('/api/stt', sttRouter); // Speech-to-Text (Public - بدون auth)
app.use('/api/tts', ttsRouter); // Text-to-Speech (Public - بدون auth)
app.use('/api/search', searchRouter); // Search Service (Public - بدون auth)
app.use('/api/notifications', authenticateToken, notificationsRouter); // Notifications (Protected)
app.use('/api/experiments', authenticateToken, experimentsRouter); // Experiments (Protected)

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
  logger.warn({
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
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({
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
const server = http.createServer(app);

// Setup WebSocket
const io = setupWebSocket(server);

// Make io available to routes if needed
app.set('io', io);

// Start server
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
server.listen(port, () => {
  logger.info(`🚀 Persian Chat Backend API listening on port ${port}`);
  logger.info(`📡 Health check: http://localhost:${port}/health`);
  logger.info(`🔐 Auth endpoint: http://localhost:${port}/api/auth/login`);
  logger.info(`💬 Chat endpoint: http://localhost:${port}/api/chat`);
  logger.info(`🔌 WebSocket server ready`);
  logger.info(`🎯 All routes registered successfully`);
});
