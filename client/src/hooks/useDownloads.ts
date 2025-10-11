// hooks/useDownloads.ts - نسخه به‌روزرسانی شده
import { useState, useEffect, useCallback } from 'react';
import { getApi } from '@/shared/utils/api';

// New interfaces for useAvailableModels
interface Model {
  id: string;
  name: string;
  type: string;
  size: string;
  provider?: string;
  downloadUrl?: string;
}

interface UseAvailableModelsReturn {
  models: Model[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface DownloadJob {
  id: string;
  url: string;
  dest: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  bytesReceived: number;
  bytesTotal?: number;
  progress?: number;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export function useDownloads() {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      // استفاده از endpoint جدید
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/download/jobs`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok && data.jobs) {
        setJobs(data.jobs);
      } else {
        throw new Error(data.error || 'Failed to fetch download jobs');
      }
    } catch (err: any) {
      console.error('Failed to fetch download jobs:', err);
      setError(err.message);
    }
  }, []);

  const startDownload = useCallback(async (
    url: string,
    dest: string,
    kind: string = 'generic'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          dest,
          kind
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        await fetchJobs();
        return data.id;
      } else {
        throw new Error(data.error || 'Failed to start download');
      }
    } catch (err: any) {
      const message = err.message || 'Failed to start download';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  const cancelDownload = useCallback(async (jobId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/download/job?id=${jobId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchJobs();
    } catch (err: any) {
      console.error('Failed to cancel download:', err);
      throw err;
    }
  }, [fetchJobs]);

  // Poll for updates every 2 seconds
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    startDownload,
    cancelDownload,
    refreshJobs: fetchJobs,
  };
}

/**
 * Hook to fetch available models from the API
 * Handles errors gracefully and provides retry mechanism
 */
export const useAvailableModels = (): UseAvailableModelsReturn => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/models/available', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setModels(data.models || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load available models';
      console.error('useAvailableModels error:', errorMessage);
      setError(errorMessage);
      // Set empty array on error instead of keeping old data
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
  };
};