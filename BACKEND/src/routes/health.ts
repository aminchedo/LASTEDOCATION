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

/**
 * GET /health/detailed
 * Detailed health check for monitoring dashboard
 */
router.get('/detailed', async (req: Request, res: Response): Promise<void> => {
  try {
    // Run all health checks
    const [database, filesystem, memory] = await Promise.all([
      checkDatabase(),
      checkFilesystem(),
      Promise.resolve(checkMemory())
    ]);

    // Format checks for dashboard
    const checks = [
      {
        componentName: 'database',
        status: database.status === 'healthy' ? 'pass' : 'fail',
        responseTime: database.latency || 0,
        output: database.message
      },
      {
        componentName: 'filesystem',
        status: filesystem.status === 'healthy' ? 'pass' : 'fail',
        responseTime: 0,
        output: filesystem.message
      },
      {
        componentName: 'memory',
        status: memory.status === 'healthy' ? 'pass' : 'fail',
        output: memory.message
      },
      {
        componentName: 'diskSpace',
        status: filesystem.status === 'healthy' ? 'pass' : 'fail',
        output: filesystem.details?.diskSpace?.available 
          ? `Available: ${filesystem.details.diskSpace.available}`
          : 'Disk space OK'
      }
    ];

    const overallStatus = checks.every(c => c.status === 'pass') ? 'healthy' : 
                         checks.some(c => c.status === 'fail') ? 'unhealthy' : 'degraded';

    res.json({
      status: overallStatus,
      data: {
        checks
      }
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      data: {
        checks: [],
        error: error.message
      }
    });
  }
});

export default router;
