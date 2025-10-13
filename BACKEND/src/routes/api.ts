/**
 * Main API router - aggregates all routes
 */
import { Router } from 'express';
import authRoutes from './auth';
import modelsRoutes from './models';
import sourcesRoutes from './sources';
import trainingRoutes from './training';
import datasetsRoutes from './datasets';
import settingsRoutes from './settings';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes (no authentication)
router.use('/auth', authRoutes);

// Protected routes (require authentication)
router.use('/models', authenticateToken, modelsRoutes);
router.use('/sources', authenticateToken, sourcesRoutes);
router.use('/training', authenticateToken, trainingRoutes);
router.use('/datasets', authenticateToken, datasetsRoutes);
router.use('/settings', authenticateToken, settingsRoutes);

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
