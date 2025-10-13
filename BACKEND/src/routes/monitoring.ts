import { Router } from 'express';
import { systemMonitor } from '../monitoring/system';
import { performanceMonitor } from '../monitoring/performance';
import { analyticsTracker } from '../monitoring/analytics';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// System metrics
router.get(
  '/system',
  asyncHandler(async (req, res) => {
    const metrics = systemMonitor.getMetrics();
    res.json({ success: true, data: metrics });
  })
);

// Performance metrics
router.get(
  '/performance',
  asyncHandler(async (req, res) => {
    const operations = performanceMonitor.getOperations();
    const stats = operations.map((op) => ({
      operation: op,
      ...performanceMonitor.getStats(op),
    }));
    
    res.json({ success: true, data: stats });
  })
);

// API analytics
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const stats = analyticsTracker.getEndpointStats();
    const errorRate = analyticsTracker.getErrorRate(5);
    
    res.json({
      success: true,
      data: {
        ...stats,
        errorRate,
      },
    });
  })
);

export default router;
