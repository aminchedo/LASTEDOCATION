import { Request, Response } from 'express';
import { getAnalytics as getMiddlewareAnalytics, resetAnalytics } from '../middleware/analytics';

/**
 * Extended analytics interface
 */
export interface Analytics {
  requests: {
    total: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
  };
  performance: {
    averageResponseTime: number;
    successRate: string;
  };
  errors: {
    total: number;
    rate: string;
  };
  period: {
    lastReset: Date;
    uptimeSinceReset: number;
  };
}

/**
 * Get analytics data endpoint
 */
export function getAnalytics(req: Request, res: Response) {
  try {
    const data = getMiddlewareAnalytics();
    
    const analytics: Analytics = {
      requests: {
        total: data.total,
        byEndpoint: data.byEndpoint,
        byMethod: data.byMethod,
        byStatus: data.byStatus,
      },
      performance: {
        averageResponseTime: data.averageResponseTime,
        successRate: data.successRate,
      },
      errors: {
        total: data.errors,
        rate: data.total > 0 ? ((data.errors / data.total) * 100).toFixed(2) + '%' : '0%',
      },
      period: {
        lastReset: data.lastReset,
        uptimeSinceReset: Math.round((Date.now() - data.lastReset.getTime()) / 1000),
      },
    };

    res.json({
      status: 'success',
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Reset analytics endpoint
 */
export function resetAnalyticsEndpoint(req: Request, res: Response) {
  try {
    resetAnalytics();
    
    res.json({
      status: 'success',
      message: 'Analytics reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(req: Request, res: Response) {
  try {
    const data = getMiddlewareAnalytics();
    
    // Get top endpoints
    const topEndpoints = Object.entries(data.byEndpoint)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Get error endpoints
    const errorEndpoints = Object.entries(data.byEndpoint)
      .filter(([endpoint]) => {
        // This is simplified - in production, track errors per endpoint
        return false;
      });

    res.json({
      status: 'success',
      data: {
        summary: {
          totalRequests: data.total,
          averageResponseTime: data.averageResponseTime + 'ms',
          successRate: data.successRate,
          errorRate: ((data.errors / data.total) * 100).toFixed(2) + '%',
        },
        topEndpoints,
        methodDistribution: data.byMethod,
        statusDistribution: data.byStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get analytics summary',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default {
  getAnalytics,
  resetAnalyticsEndpoint,
  getAnalyticsSummary,
};
