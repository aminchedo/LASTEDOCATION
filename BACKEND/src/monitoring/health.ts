import { Request, Response } from 'express';
import os from 'os';
import { logger } from '../config/logger';

/**
 * Health check status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database?: HealthCheck;
    memory?: HealthCheck;
    disk?: HealthCheck;
    api?: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  value?: any;
}

/**
 * Basic health check endpoint
 */
export function basicHealthCheck(req: Request, res: Response) {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

/**
 * Detailed health check with system metrics
 */
export async function detailedHealthCheck(req: Request, res: Response) {
  try {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        memory: checkMemory(),
        disk: checkDisk(),
        api: checkAPI(),
      },
    };

    // Determine overall status
    const checks = Object.values(health.checks);
    if (checks.some(check => check?.status === 'fail')) {
      health.status = 'unhealthy';
    } else if (checks.some(check => check?.status === 'warn')) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const used = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercentage = ((totalMem - freeMem) / totalMem) * 100;

  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let message = 'Memory usage normal';

  if (usedPercentage > 90) {
    status = 'fail';
    message = 'Critical memory usage';
  } else if (usedPercentage > 75) {
    status = 'warn';
    message = 'High memory usage';
  }

  return {
    status,
    message,
    value: {
      heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(used.external / 1024 / 1024) + 'MB',
      systemUsage: usedPercentage.toFixed(2) + '%',
    },
  };
}

/**
 * Check disk usage
 */
function checkDisk(): HealthCheck {
  // Note: This is a simplified check. In production, use a library like 'diskusage'
  return {
    status: 'pass',
    message: 'Disk usage normal',
    value: {
      // Placeholder - implement actual disk check if needed
      note: 'Disk monitoring not implemented',
    },
  };
}

/**
 * Check API responsiveness
 */
function checkAPI(): HealthCheck {
  const uptime = process.uptime();
  
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let message = 'API responsive';

  if (uptime < 60) {
    status = 'warn';
    message = 'Recently started';
  }

  return {
    status,
    message,
    value: {
      uptime: Math.round(uptime) + 's',
      nodeVersion: process.version,
      platform: process.platform,
    },
  };
}

export default {
  basicHealthCheck,
  detailedHealthCheck,
};
