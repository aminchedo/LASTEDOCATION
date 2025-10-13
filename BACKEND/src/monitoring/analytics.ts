import { Request, Response } from 'express';
import { log } from '../config/logger';

interface ApiAnalytics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: string;
}

class AnalyticsTracker {
  private analytics: ApiAnalytics[] = [];
  private readonly maxRecords = 10000;

  // Track API call
  track(req: Request, res: Response, duration: number) {
    const record: ApiAnalytics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date(),
      userId: req['user']?.id,
    };

    this.analytics.push(record);

    // Keep only recent records
    if (this.analytics.length > this.maxRecords) {
      this.analytics.shift();
    }
  }

  // Get endpoint statistics
  getEndpointStats(endpoint?: string) {
    const filtered = endpoint
      ? this.analytics.filter((a) => a.endpoint === endpoint)
      : this.analytics;

    const total = filtered.length;
    const successful = filtered.filter((a) => a.statusCode < 400).length;
    const failed = total - successful;
    
    const durations = filtered.map((a) => a.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDuration,
      endpoints: this.getTopEndpoints(10),
    };
  }

  // Get top endpoints by traffic
  private getTopEndpoints(limit: number = 10) {
    const endpointCounts = new Map<string, number>();
    
    this.analytics.forEach((a) => {
      const key = `${a.method} ${a.endpoint}`;
      endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
    });

    return Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  // Get error rate
  getErrorRate(minutes: number = 5) {
    const since = new Date(Date.now() - minutes * 60000);
    const recent = this.analytics.filter((a) => a.timestamp >= since);
    
    const total = recent.length;
    const errors = recent.filter((a) => a.statusCode >= 400).length;
    
    return {
      total,
      errors,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
      timeWindow: `${minutes} minutes`,
    };
  }

  // Clear analytics
  clear() {
    this.analytics = [];
  }
}

export const analyticsTracker = new AnalyticsTracker();
