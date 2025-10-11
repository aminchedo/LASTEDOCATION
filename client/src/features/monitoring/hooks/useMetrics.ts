import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { apiGet } from '@/shared/utils/api';

export interface MetricsData {
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
  requestsOverTime: Array<{ timestamp: number; count: number }>;
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

const MOCK_DATA: MetricsData = {
  totalRequests: 1247,
  avgResponseTime: 342,
  successRate: 98.4,
  errorRate: 1.6,
  requestsOverTime: Array.from({ length: 24 }, (_, i) => ({
    timestamp: Date.now() - (23 - i) * 3600000,
    count: Math.floor(Math.random() * 100) + 20,
  })),
  responseTimeDistribution: [
    { range: '0-100ms', count: 423 },
    { range: '100-300ms', count: 567 },
    { range: '300-500ms', count: 189 },
    { range: '500-1000ms', count: 54 },
    { range: '1000ms+', count: 14 },
  ],
  recentActivity: Array.from({ length: 10 }, (_, i) => ({
    id: `activity-${i}`,
    timestamp: Date.now() - i * 60000,
    method: ['GET', 'POST', 'PUT'][Math.floor(Math.random() * 3)],
    path: ['/api/chat', '/api/monitoring', '/api/settings'][Math.floor(Math.random() * 3)],
    status: Math.random() > 0.1 ? 200 : 500,
    duration: Math.floor(Math.random() * 1000) + 50,
  })),
};

export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricsData>(MOCK_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGet<MetricsData>('/api/monitoring/metrics');
      setMetrics(data);
    } catch (err: any) {
      console.error('Failed to fetch metrics:', err);
      const errorMessage = err.message || 'خطا در دریافت داده‌ها';
      setError(errorMessage);
      
      // Use mock data as fallback
      setMetrics(MOCK_DATA);
      
      // Only show error toast on user-initiated refresh, not auto-refresh
      if (!autoRefresh) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [autoRefresh]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => !prev);
    toast.success(autoRefresh ? 'بروزرسانی خودکار غیرفعال شد' : 'بروزرسانی خودکار فعال شد');
  }, [autoRefresh]);

  const refresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    autoRefresh,
    toggleAutoRefresh,
    refresh,
  };
}
