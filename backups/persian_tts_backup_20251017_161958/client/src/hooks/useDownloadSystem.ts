// hooks/useDownloadSystem.ts
import { useState, useEffect, useCallback } from 'react';

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

interface ApiResponse {
  ok: boolean;
  jobs?: DownloadJob[];
  job?: DownloadJob;
  error?: string;
  id?: string;
  message?: string;
}

const API_BASE = 'http://localhost:3001';

export function useDownloadSystem() {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // دریافت لیست همه jobs
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/download/jobs`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.ok && data.jobs) {
        setJobs(data.jobs);
      } else {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // شروع دانلود جدید
  const startDownload = useCallback(async (url: string, dest: string, kind: string = 'generic') => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/download`, {
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

      const data: ApiResponse = await response.json();
      
      if (data.ok) {
        // دریافت لیست به‌روز شده
        await fetchJobs();
        return data.id;
      } else {
        throw new Error(data.error || 'Failed to start download');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  // دریافت وضعیت یک job خاص
  const fetchJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/download/status?id=${jobId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.ok && data.job) {
        // آپدیت job در لیست
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId ? data.job! : job
          )
        );
        return data.job;
      } else {
        throw new Error(data.error || 'Failed to fetch job status');
      }
    } catch (err) {
      console.error('Error fetching job status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // حذف job
  const deleteJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/download/job?id=${jobId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.ok) {
        // حذف job از لیست
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      } else {
        throw new Error(data.error || 'Failed to delete job');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // بررسی سلامت سرویس
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/download/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.ok === true;
    } catch (err) {
      console.error('Health check failed:', err);
      return false;
    }
  }, []);

  // بارگذاری اولیه و polling
  useEffect(() => {
    fetchJobs();
    
    // polling هر 2 ثانیه برای آپدیت وضعیت
    const interval = setInterval(fetchJobs, 2000);
    
    return () => clearInterval(interval);
  }, [fetchJobs]);

  return {
    // state
    jobs,
    loading,
    error,
    
    // actions
    startDownload,
    fetchJobs,
    fetchJobStatus,
    deleteJob,
    checkHealth,
    
    // computed values
    activeJobs: jobs.filter(job => job.status === 'running' || job.status === 'pending'),
    completedJobs: jobs.filter(job => job.status === 'completed'),
    failedJobs: jobs.filter(job => job.status === 'error'),
  };
}

// utility functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('fa-IR');
};

export const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'در انتظار',
    'running': 'در حال دانلود',
    'completed': 'تکمیل شده',
    'error': 'خطا'
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'running': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'error': 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};