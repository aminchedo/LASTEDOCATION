// File: client/src/hooks/useMonitoring.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MonitoringData, HealthData, SystemMetrics, ApiAnalytics, PerformanceMetrics } from '../types/monitoring.types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const ENDPOINTS = {
  health: `${API_BASE}/health/detailed`,
  system: `${API_BASE}/api/monitoring/system`,
  analytics: `${API_BASE}/api/monitoring/analytics`,
  performance: `${API_BASE}/api/monitoring/performance`,
} as const;

interface UseMonitoringOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export function useMonitoring(options: UseMonitoringOptions = {}) {
  const { autoRefresh = true, refreshInterval = 10000 } = options;

  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMonitoringData = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setError(null);

      const [healthRes, systemRes, analyticsRes, performanceRes] = await Promise.all([
        fetch(ENDPOINTS.health, { signal }),
        fetch(ENDPOINTS.system, { signal }),
        fetch(ENDPOINTS.analytics, { signal }),
        fetch(ENDPOINTS.performance, { signal }),
      ]);

      // Check if all requests succeeded
      if (!healthRes.ok || !systemRes.ok || !analyticsRes.ok || !performanceRes.ok) {
        throw new Error('One or more API requests failed');
      }

      const [healthData, systemData, analyticsData, performanceData] = await Promise.all([
        healthRes.json(),
        systemRes.json(),
        analyticsRes.json(),
        performanceRes.json(),
      ]);

      setData({
        health: healthData.data as HealthData,
        system: systemData.data as SystemMetrics,
        analytics: analyticsData.data as ApiAnalytics,
        performance: performanceData.data as PerformanceMetrics,
      });

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    intervalRef.current = setInterval(() => {
      fetchMonitoringData();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchMonitoringData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchMonitoringData,
    lastUpdated,
  };
}
