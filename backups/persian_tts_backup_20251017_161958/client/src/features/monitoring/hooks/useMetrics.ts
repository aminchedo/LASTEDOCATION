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

const EMPTY_METRICS: MetricsData = {
  totalRequests: 0,
  avgResponseTime: 0,
  successRate: 0,
  errorRate: 0,
  requestsOverTime: [],
  responseTimeDistribution: [],
  recentActivity: [],
};

export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricsData>(EMPTY_METRICS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGet<MetricsData>('/api/monitoring/metrics');
      
      if (!data || data.totalRequests === 0) {
        setIsEmpty(true);
        setMetrics(EMPTY_METRICS);
      } else {
        setIsEmpty(false);
        setMetrics(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch metrics:', err);
      const errorMessage = err.message || 'خطا در دریافت داده‌ها';
      setError(errorMessage);
      setMetrics(EMPTY_METRICS);
      
      if (!autoRefresh) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [autoRefresh]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

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
    isEmpty,
    autoRefresh,
    toggleAutoRefresh,
    refresh,
  };
}
