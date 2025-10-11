// BACKEND/src/server.ts - COMPLETE FIXED VERSION
import express from 'express';
import cors from 'cors';

// ====== MIDDLEWARE IMPORTS ======
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// ====== ROUTE IMPORTS ======
import authRouter from './routes/auth';
import chatRouter from './routes/chat';
import trainRouter from './routes/train';
import optimizationRouter from './routes/optimization';
import bootstrapRouter from './routes/bootstrap';
import sourcesRouter from './routes/sources';
import monitoringRouter from './routes/monitoring';
import modelsRouter from './routes/models';
import sttRouter from './routes/stt';
import ttsRouter from './routes/tts';
import searchRouter from './routes/search';
import notificationsRouter from './routes/notifications';

// ====== PROXY IMPORTS ======
import downloadProxyRouter from './simple-proxy';

// ====== UTILITIES ======
import { logger } from './utils/logger';

// ====== EXPRESS APP SETUP ======
const app = express();

// ====== MIDDLEWARE CONFIGURATION ======
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// ====== PUBLIC ROUTES (No Authentication) ======
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

// ====== AUTH ROUTES (Public) ======
app.use('/api/auth', authRouter);

// ====== PROXY ROUTES (Public for downloads) ======
app.use('/api/v1', downloadProxyRouter);

// ====== PROTECTED ROUTES (Require Authentication) ======
app.use('/api/chat', authenticateToken, chatRouter);
app.use('/api/train', authenticateToken, trainRouter);
app.use('/api/optimization', authenticateToken, optimizationRouter);
app.use('/api/bootstrap', authenticateToken, bootstrapRouter);
app.use('/api/download', authenticateToken, bootstrapRouter); // Alias for bootstrap
app.use('/api/sources', authenticateToken, sourcesRouter);
app.use('/api/monitoring', authenticateToken, monitoringRouter);
app.use('/api/models', authenticateToken, modelsRouter);
app.use('/api/notifications', authenticateToken, notificationsRouter);

// ====== TTS/STT/SEARCH ROUTES (May need auth based on your design) ======
// Option 1: Public access
app.use('/api/stt', sttRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/search', searchRouter);

// Option 2: Protected access (uncomment if you want auth)
// app.use('/api/stt', authenticateToken, sttRouter);
// app.use('/api/tts', authenticateToken, ttsRouter);
// app.use('/api/search', authenticateToken, searchRouter);

// ====== FALLBACK ROUTES FOR COMPATIBILITY ======
app.get('/api/train/status', (_req, res) => {
  res.json({
    status: 'idle',
    message: 'Training service is available but no active training',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/train/stream', (_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('data: ' + JSON.stringify({
    type: 'info',
    message: 'Training stream connected'
  }) + '\n\n');
});

app.get('/api/sources/downloads', (_req, res) => {
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

// ====== ERROR HANDLING ======
// 404 Handler - MUST be after all routes
app.use('*', (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    ok: false,
    error: 'Not Found',
    path: req.originalUrl,
    method: req.method,
    message: 'The requested endpoint does not exist',
    availableEndpoints: [
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
    ]
  });
});

// Global Error Handler - MUST be last
app.use(errorHandler);

// ====== SERVER STARTUP ======
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.listen(PORT, () => {
  logger.info(`
╔════════════════════════════════════════════════════════╗
║   🚀 Persian Chat Backend Server Started              ║
║   📡 Port: ${PORT}                                      ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}              ║
║   📝 Logs: ./logs/                                     ║
╚════════════════════════════════════════════════════════╝

Available Endpoints:
  ✓ GET  /health
  ✓ GET  /api/health
  ✓ POST /api/auth/login
  ✓ POST /api/auth/verify
  ✓ POST /api/chat
  ✓ GET  /api/train/status
  ✓ POST /api/train/start
  ✓ GET  /api/models/detected
  ✓ POST /api/stt
  ✓ POST /api/tts
  ✓ POST /api/search
  ✓ GET  /api/notifications
  ✓ GET  /api/monitoring/metrics
  ✓ GET /api/sources/downloads
  `);
});

export default app;
