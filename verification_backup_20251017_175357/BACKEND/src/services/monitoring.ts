import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';

export interface RealMetrics {
  totalRequests: number;
  avgResponseTimeMs: number;
  successRate: number;
  errorRate: number;
  requestsOverTime: Array<{ timestamp: number; value: number }>;
  responseTimeDistribution: Array<{ range: string; count: number }>;
  recentActivity: Array<{
    id: string;
    timestamp: number;
    method: string;
    path: string;
    status: number;
    duration: number;
  }>;
}

interface LogEntry {
  method?: string;
  url?: string;
  status?: string;
  response_time_ms?: number;
  date?: string;
}

function parseLogFile(filePath: string, maxLines = 1000): LogEntry[] {
  if (!fs.existsSync(filePath)) return [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim()).slice(-maxLines);
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return {};
      }
    }).filter(entry => entry.method && entry.url);
  } catch (err) {
    logger.error({ msg: 'Error parsing log file', path: filePath, err });
    return [];
  }
}

export function getRealMetrics(): RealMetrics {
  const logPath = path.join(process.cwd(), 'logs', 'api.log');
  const entries = parseLogFile(logPath);
  
  const totalRequests = entries.length;
  const successfulRequests = entries.filter(e => e.status && parseInt(e.status) < 400).length;
  const errorRequests = entries.filter(e => e.status && parseInt(e.status) >= 400).length;
  
  const responseTimes = entries
    .map(e => e.response_time_ms)
    .filter((t): t is number => typeof t === 'number');
  
  const avgResponseTimeMs = responseTimes.length > 0
    ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
    : 0;
  
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
  const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
  
  // Group requests by hour for time series
  const requestsByHour: Map<number, number> = new Map();
  entries.forEach(entry => {
    if (entry.date) {
      const timestamp = new Date(entry.date).getTime();
      const hourKey = Math.floor(timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
      requestsByHour.set(hourKey, (requestsByHour.get(hourKey) || 0) + 1);
    }
  });
  
  const requestsOverTime = Array.from(requestsByHour.entries())
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-24); // Last 24 hours
  
  // Response time distribution
  const distribution: Map<string, number> = new Map();
  responseTimes.forEach(time => {
    const bucket = Math.floor(time / 100) * 100;
    const range = `${bucket}-${bucket + 100}ms`;
    distribution.set(range, (distribution.get(range) || 0) + 1);
  });
  
  const responseTimeDistribution = Array.from(distribution.entries())
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => {
      const aStart = parseInt(a.range.split('-')[0]);
      const bStart = parseInt(b.range.split('-')[0]);
      return aStart - bStart;
    })
    .slice(0, 10);
  
  // Recent activity
  const recentActivity = entries
    .slice(-20)
    .reverse()
    .map((entry, idx) => ({
      id: `activity-${idx}`,
      timestamp: entry.date ? new Date(entry.date).getTime() : Date.now(),
      method: entry.method || 'GET',
      path: entry.url || '/',
      status: entry.status ? parseInt(entry.status) : 200,
      duration: entry.response_time_ms || 0,
    }));
  
  return {
    totalRequests,
    avgResponseTimeMs,
    successRate,
    errorRate,
    requestsOverTime,
    responseTimeDistribution,
    recentActivity,
  };
}

export interface ActivityEvent {
  id: string;
  type: 'request' | 'download' | 'training' | 'tts';
  timestamp: number;
  description: string;
  status: 'success' | 'error' | 'pending';
  metadata?: Record<string, any>;
}

export function getRecentActivity(limit = 50): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  
  // Parse API logs
  const apiLogPath = path.join(process.cwd(), 'logs', 'api.log');
  const apiEntries = parseLogFile(apiLogPath, limit);
  
  apiEntries.forEach((entry, idx) => {
    events.push({
      id: `api-${idx}`,
      type: 'request',
      timestamp: entry.date ? new Date(entry.date).getTime() : Date.now(),
      description: `${entry.method} ${entry.url}`,
      status: entry.status && parseInt(entry.status) < 400 ? 'success' : 'error',
      metadata: {
        method: entry.method,
        url: entry.url,
        status: entry.status,
        responseTime: entry.response_time_ms,
      },
    });
  });
  
  // Sort by timestamp descending
  events.sort((a, b) => b.timestamp - a.timestamp);
  
  return events.slice(0, limit);
}
