import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/shared/utils/api';

export interface TrainingJob {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  metrics?: {
    loss: number;
    accuracy: number;
    epoch: number;
  };
}

export interface TrainingConfig {
  totalEpochs?: number;
  totalSteps?: number;
  learningRate?: number;
  batchSize?: number;
  saveEverySteps?: number;
  resumeCheckpointId?: string;
}umber;
  };
}

export function useTraining() {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<TrainingJob[]>('/api/training/jobs');
      
      if (response.success) {
        setJobs(response.data);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch training jobs');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch training jobs';
      setError(errorMessage);
      console.error('Training jobs fetch error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const startTraining = useCallback(async (config: any) => {
    try {
      const response = await apiService.post('/api/training/start', config);
      
      if (response.success) {
        await fetchJobs(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to start training');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start training';
      console.error('Training start error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchJobs]);

  const stopTraining = useCallback(async (jobId: string) => {
    try {
      const response = await apiService.post(`/api/training/${jobId}/stop`);
      
      if (response.success) {
        await fetchJobs(); // Refresh the list
        return true;
      } else {
        throw new Error(response.error || 'Failed to stop training');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to stop training';
      console.error('Training stop error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchJobs]);

  const resumeTraining = useCallback(async (jobId: string) => {
    try {
      const response = await apiService.post(`/api/training/${jobId}/resume`);
      
      if (response.success) {
        await fetchJobs(); // Refresh the list
        return true;
      } else {
        throw new Error(response.error || 'Failed to resume training');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resume training';
      console.error('Training resume error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobs();
    
    // Auto-refresh active jobs
    const timer = setInterval(() => {
      const hasActiveJobs = jobs.some(
        (job) => job.status === 'running' || job.status === 'queued'
      );
      if (hasActiveJobs) {
        fetchJobs();
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [fetchJobs, jobs]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    startTraining,
    stopTraining,
    resumeTraining,
  };
}