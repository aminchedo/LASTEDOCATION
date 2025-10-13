import { Request, Response } from 'express';
import os from 'os';
import { performance } from 'perf_hooks';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  timestamp: string;
  process: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: {
      user: number;
      system: number;
    };
  };
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    loadAverage: number[];
    freeMemory: string;
    totalMemory: string;
    cpuCount: number;
  };
  performance: {
    eventLoopLag?: number;
    responseTime?: number;
  };
}

// Store performance history
const performanceHistory: Array<{
  timestamp: number;
  responseTime: number;
}> = [];

const MAX_HISTORY = 100;

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(req: Request, res: Response) {
  const metrics: PerformanceMetrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      loadAverage: os.loadavg(),
      freeMemory: formatBytes(os.freemem()),
      totalMemory: formatBytes(os.totalmem()),
      cpuCount: os.cpus().length,
    },
    performance: {
      eventLoopLag: measureEventLoopLag(),
      responseTime: calculateAverageResponseTime(),
    },
  };

  res.json({
    status: 'success',
    data: metrics,
  });
}

/**
 * Track response time
 */
export function trackResponseTime(duration: number) {
  performanceHistory.push({
    timestamp: Date.now(),
    responseTime: duration,
  });

  // Keep only last MAX_HISTORY entries
  if (performanceHistory.length > MAX_HISTORY) {
    performanceHistory.shift();
  }
}

/**
 * Calculate average response time
 */
function calculateAverageResponseTime(): number | undefined {
  if (performanceHistory.length === 0) return undefined;

  const sum = performanceHistory.reduce((acc, entry) => acc + entry.responseTime, 0);
  return Math.round(sum / performanceHistory.length);
}

/**
 * Measure event loop lag
 */
function measureEventLoopLag(): number {
  const start = performance.now();
  setImmediate(() => {
    const lag = performance.now() - start;
    return lag;
  });
  return 0; // Simplified - implement proper event loop monitoring if needed
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  return {
    averageResponseTime: calculateAverageResponseTime(),
    sampleCount: performanceHistory.length,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  };
}

export default {
  getPerformanceMetrics,
  trackResponseTime,
  getPerformanceSummary,
};
