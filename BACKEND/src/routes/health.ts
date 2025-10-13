import { Router } from 'express';
import { healthCheckService } from '../monitoring/health';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// Basic health check
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const health = await healthCheckService.check(false);
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health,
    });
  })
);

// Detailed health check with metrics
router.get(
  '/detailed',
  asyncHandler(async (req, res) => {
    const health = await healthCheckService.check(true);
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health,
    });
  })
);

export default router;
