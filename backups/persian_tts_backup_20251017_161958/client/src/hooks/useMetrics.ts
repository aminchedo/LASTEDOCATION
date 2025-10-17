import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/shared/utils/api';

interface MetricsData {
  cpu: number;
  memory: number;
  gpu: number[];
  disk: number;
  network: { upload: number; download: number };
}

export function useMetrics(autoRefresh = false, interval = 30000) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<MetricsData>('/api/monitoring/metrics');
      
      if (response.success) {
        setMetrics(response.data);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch metrics');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch metrics';
      setError(errorMessage);
      console.error('Metrics fetch error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const timer = setInterval(fetchMetrics, interval);
      return () => clearInterval(timer);
    }
  }, [fetchMetrics, autoRefresh, interval]);

  return { 
    metrics, 
    loading, 
    error, 
    refetch: fetchMetrics 
  };
}
