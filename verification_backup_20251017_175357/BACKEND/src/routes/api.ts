/**
 * Main API router - aggregates all routes with rate limiting
 */
import { Router } from 'express';
import authRoutes from './auth';
import modelsRoutes from './models';
import sourcesRoutes from './sources-new';
import trainingRoutes from './training-new';
import datasetsRoutes from './datasets';
import settingsRoutes from './settings-new';
import { authenticateToken } from '../middleware/auth';
import { 
  authLimiter, 
  trainingLimiter,
  searchLimiter,
  settingsLimiter
} from '../middleware/rate-limiter';

const router = Router();

// Public routes (with strict rate limiting)
router.use('/auth', authLimiter, authRoutes);

// Protected routes (require authentication + specific rate limits)
router.use('/models', authenticateToken, modelsRoutes);

// Sources with search rate limiting
router.use('/sources/search', authenticateToken, searchLimiter);
router.use('/sources', authenticateToken, sourcesRoutes);

// Training with strict rate limiting
router.use('/training', authenticateToken, trainingLimiter, trainingRoutes);

// Datasets
router.use('/datasets', authenticateToken, datasetsRoutes);

// Settings with moderate rate limiting
router.use('/settings', authenticateToken, settingsLimiter, settingsRoutes);

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

export default router;
