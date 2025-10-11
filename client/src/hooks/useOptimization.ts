import { useState, useEffect, useCallback } from 'react';
import { getApi } from '@/shared/utils/api';

export interface HyperparameterConfig {
  learningRate: {
    min: number;
    max: number;
    step?: number;
    distribution?: 'uniform' | 'log_uniform';
  };
  batchSize: number[];
  epochs: {
    min: number;
    max: number;
  };
  warmupSteps?: {
    min: number;
    max: number;
  };
  weightDecay?: {
    min: number;
    max: number;
  };
  dropout?: {
    min: number;
    max: number;
  };
}

export interface OptimizationJob {
  id: string;
  name: string;
  baseModelPath: string;
  datasetPath: string;
  outputDir: string;
  config: HyperparameterConfig;
  strategy: 'grid' | 'random' | 'bayesian';
  maxTrials: number;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  progress: number;
  currentTrial: number;
  totalTrials: number;
  bestTrial?: TrialResult;
  trials: TrialResult[];
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export interface TrialResult {
  id: string;
  trialNumber: number;
  hyperparameters: Record<string, any>;
  metrics: {
    loss: number;
    accuracy: number;
    f1Score: number;
    precision: number;
    recall: number;
    perplexity?: number;
    bleuScore?: number;
  };
  trainingTime: number;
  status: 'completed' | 'failed' | 'running';
  outputPath: string;
  logs: string[];
}

export interface OptimizationMetrics {
  totalOptimizations: number;
  averageImprovement: number;
  bestModelAccuracy: number;
  totalTrainingTime: number;
  successfulTrials: number;
  failedTrials: number;
  averageTrialTime: number;
}

export function useOptimization() {
  const [jobs, setJobs] = useState<OptimizationJob[]>([]);
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await getApi().get('/api/optimization/jobs');
      if (response.data.success) {
        setJobs(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch optimization jobs:', err);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await getApi().get('/api/optimization/metrics');
      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch optimization metrics:', err);
    }
  }, []);

  const startOptimization = useCallback(async (
    name: string,
    baseModelPath: string,
    datasetPath: string,
    outputDir: string,
    config: HyperparameterConfig,
    strategy: 'grid' | 'random' | 'bayesian' = 'random',
    maxTrials: number = 10
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApi().post('/api/optimization/jobs', {
        name,
        baseModelPath,
        datasetPath,
        outputDir,
        config,
        strategy,
        maxTrials,
      });
      if (response.data.success) {
        await fetchJobs();
        return response.data.data as OptimizationJob;
      } else {
        throw new Error(response.data.error || 'Failed to start optimization');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to start optimization';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  const cancelOptimization = useCallback(async (jobId: string) => {
    try {
      await getApi().post(`/api/optimization/jobs/${jobId}/cancel`);
      await fetchJobs();
    } catch (err: any) {
      console.error('Failed to cancel optimization:', err);
      throw err;
    }
  }, [fetchJobs]);

  const pruneModel = useCallback(async (
    modelPath: string,
    outputPath: string,
    config: {
      method: 'magnitude' | 'gradient' | 'random';
      sparsity: number;
      structured: boolean;
      gradual: boolean;
    }
  ) => {
    try {
      const response = await getApi().post('/api/optimization/prune', {
        modelPath,
        outputPath,
        config,
      });
      return response.data;
    } catch (err: any) {
      console.error('Failed to prune model:', err);
      throw err;
    }
  }, []);

  const quantizeModel = useCallback(async (
    modelPath: string,
    outputPath: string,
    config: {
      method: 'dynamic' | 'static' | 'qat';
      bits: 8 | 16 | 32;
      symmetric: boolean;
      calibrationDataset?: string;
    }
  ) => {
    try {
      const response = await getApi().post('/api/optimization/quantize', {
        modelPath,
        outputPath,
        config,
      });
      return response.data;
    } catch (err: any) {
      console.error('Failed to quantize model:', err);
      throw err;
    }
  }, []);

  const compareModels = useCallback(async (
    name: string,
    modelPaths: string[],
    testDataset: string,
    comparisonMetrics: string[]
  ) => {
    try {
      const response = await getApi().post('/api/optimization/compare', {
        name,
        modelPaths,
        testDataset,
        comparisonMetrics,
      });
      return response.data;
    } catch (err: any) {
      console.error('Failed to compare models:', err);
      throw err;
    }
  }, []);

  // Poll for updates every 3 seconds
  useEffect(() => {
    fetchJobs();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchJobs();
      fetchMetrics();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchJobs, fetchMetrics]);

  return {
    jobs,
    metrics,
    loading,
    error,
    startOptimization,
    cancelOptimization,
    pruneModel,
    quantizeModel,
    compareModels,
    refreshJobs: fetchJobs,
    refreshMetrics: fetchMetrics,
  };
}
