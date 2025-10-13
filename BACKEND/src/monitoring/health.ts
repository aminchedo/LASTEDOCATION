import { query } from '../database/connection';
import { ENV } from '../config/env';
import { systemMonitor } from './system';
import { performanceMonitor } from './performance';
import { analyticsTracker } from './analytics';
import * as fs from 'fs/promises';
import * as path from 'path';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: HealthCheckResult;
    filesystem: HealthCheckResult;
    memory: HealthCheckResult;
    disk: HealthCheckResult;
  };
  metrics?: {
    system: any;
    performance: any;
    analytics: any;
  };
}

interface HealthCheckResult {
  status: 'pass' | 'fail';
  message?: string;
  responseTime?: number;
}

export class HealthCheckService {
  // Perform comprehensive health check
  async check(includeMetrics: boolean = false): Promise<HealthCheck> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkFilesystem(),
      this.checkMemory(),
      this.checkDiskSpace(),
    ]);

    const [database, filesystem, memory, disk] = checks;

    // Determine overall status
    const allPassed = checks.every((c) => c.status === 'pass');
    const anyFailed = checks.some((c) => c.status === 'fail');

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allPassed) {
      status = 'healthy';
    } else if (anyFailed) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    const healthCheck: HealthCheck = {
      status,
      timestamp: new Date(),
      checks: { database, filesystem, memory, disk },
    };

    // Include metrics if requested
    if (includeMetrics) {
      healthCheck.metrics = {
        system: systemMonitor.getMetrics(),
        performance: {
          operations: performanceMonitor.getOperations().map((op) =>
            performanceMonitor.getStats(op)
          ),
        },
        analytics: analyticsTracker.getEndpointStats(),
      };
    }

    return healthCheck;
  }

  // Check database connection
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      await query('SELECT 1');
      return {
        status: 'pass',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Database connection failed',
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check filesystem access
  private async checkFilesystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const modelsDir = path.join(process.cwd(), 'models');
      await fs.access(modelsDir, fs.constants.R_OK | fs.constants.W_OK);
      return {
        status: 'pass',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Models directory not accessible',
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check memory usage
  private async checkMemory(): Promise<HealthCheckResult> {
    const metrics = systemMonitor.getMetrics();
    
    if (metrics.memory.usagePercent > 95) {
      return {
        status: 'fail',
        message: `Memory usage critical: ${metrics.memory.usagePercent.toFixed(2)}%`,
      };
    }
    
    if (metrics.memory.usagePercent > 85) {
      return {
        status: 'pass',
        message: `Memory usage high: ${metrics.memory.usagePercent.toFixed(2)}%`,
      };
    }
    
    return { status: 'pass' };
  }

  // Check disk space
  private async checkDiskSpace(): Promise<HealthCheckResult> {
    try {
      const modelsDir = path.join(process.cwd(), 'models');
      const stats = await fs.stat(modelsDir);
      
      // This is a simplified check - in production, use a proper disk space library
      return { status: 'pass' };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Disk space check failed',
      };
    }
  }
}

export const healthCheckService = new HealthCheckService();
