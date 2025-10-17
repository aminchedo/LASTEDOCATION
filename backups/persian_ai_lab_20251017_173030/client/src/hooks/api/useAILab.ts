import { useState, useCallback, useEffect } from 'react';
import { getApi } from '@/shared/utils/api';
import { useWebSocket } from '../useWebSocket';
import { toast } from 'react-hot-toast';

export interface TrainingConfig {
  modelName: string;
  modelType: 'tts' | 'stt' | 'nlp' | 'cv' | 'custom';
  architecture: string;
  datasetId: string;
  parameters: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    optimizer: string;
  };
  layers?: number;
}

export interface TrainingJob {
  jobId: string;
  status: string;
  progress: number;
  currentEpoch?: number;
  totalEpochs?: number;
  metrics: {
    loss: number[];
    accuracy: number[];
    validationLoss: number[];
    validationAccuracy: number[];
  };
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface Dataset {
  id: string;
  name: string;
  type: 'text' | 'audio' | 'structured';
  description: string;
  stats: {
    rows: number;
    columns?: number;
    size: number;
    tokens?: number;
  };
  createdAt: Date;
  status: string;
}

export interface Model {
  id: string;
  name: string;
  type: string;
  architecture?: string;
  createdAt: Date;
  status: string;
  inputShape?: number[];
  outputShape?: number[];
}

export interface AILabSettings {
  baseDirectory: string;
  gpuEnabled: boolean;
  maxConcurrentJobs: number;
  autoSaveCheckpoints: boolean;
  checkpointInterval: number;
}

export function useAILab() {
  const api = getApi();
  const { socket, isConnected } = useWebSocket();
  const [activeJobs, setActiveJobs] = useState<Map<string, TrainingJob>>(new Map());
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [settings, setSettings] = useState<AILabSettings | null>(null);

  // Listen to training events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTrainingStart = (data: any) => {
      toast.success(`Training started: ${data.modelName}`);
    };

    const handleTrainingProgress = (data: any) => {
      setActiveJobs(prev => {
        const jobs = new Map(prev);
        const job = jobs.get(data.jobId);
        if (job) {
          jobs.set(data.jobId, {
            ...job,
            status: data.status,
            progress: data.progress,
            currentEpoch: data.epoch,
            totalEpochs: data.totalEpochs,
            metrics: data.metrics ? {
              ...job.metrics,
              loss: [...job.metrics.loss, data.metrics.loss].filter(Boolean),
              accuracy: [...job.metrics.accuracy, data.metrics.accuracy].filter(Boolean),
              validationLoss: [...job.metrics.validationLoss, data.metrics.validationLoss].filter(Boolean),
              validationAccuracy: [...job.metrics.validationAccuracy, data.metrics.validationAccuracy].filter(Boolean)
            } : job.metrics
          });
        }
        return jobs;
      });
    };

    const handleTrainingComplete = (data: any) => {
      toast.success(`Training completed for job ${data.jobId}`);
      setActiveJobs(prev => {
        const jobs = new Map(prev);
        const job = jobs.get(data.jobId);
        if (job) {
          jobs.set(data.jobId, {
            ...job,
            status: 'completed',
            progress: 100,
            endTime: new Date()
          });
        }
        return jobs;
      });
    };

    const handleTrainingError = (data: any) => {
      toast.error(`Training failed: ${data.error}`);
      setActiveJobs(prev => {
        const jobs = new Map(prev);
        const job = jobs.get(data.jobId);
        if (job) {
          jobs.set(data.jobId, {
            ...job,
            status: 'failed',
            error: data.error
          });
        }
        return jobs;
      });
    };

    socket.on('training:start', handleTrainingStart);
    socket.on('training:progress', handleTrainingProgress);
    socket.on('training:complete', handleTrainingComplete);
    socket.on('training:error', handleTrainingError);

    return () => {
      socket.off('training:start', handleTrainingStart);
      socket.off('training:progress', handleTrainingProgress);
      socket.off('training:complete', handleTrainingComplete);
      socket.off('training:error', handleTrainingError);
    };
  }, [socket, isConnected]);

  // Start training
  const startTraining = useCallback(async (config: TrainingConfig) => {
    try {
      const response = await api.post('/api/ai-lab/train', config);
      const { jobId } = response.data;
      
      // Add to active jobs
      setActiveJobs(prev => {
        const jobs = new Map(prev);
        jobs.set(jobId, {
          jobId,
          status: 'initializing',
          progress: 0,
          metrics: {
            loss: [],
            accuracy: [],
            validationLoss: [],
            validationAccuracy: []
          },
          startTime: new Date()
        });
        return jobs;
      });
      
      return jobId;
    } catch (error: any) {
      toast.error(`Failed to start training: ${error.message}`);
      throw error;
    }
  }, [api]);

  // Upload dataset
  const uploadDataset = useCallback(async (file: File, metadata: {
    name: string;
    type: 'text' | 'audio' | 'structured';
    description?: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append('dataset', file);
      formData.append('name', metadata.name);
      formData.append('type', metadata.type);
      if (metadata.description) {
        formData.append('description', metadata.description);
      }

      const response = await api.post('/api/ai-lab/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          // You could emit progress here
        }
      });

      toast.success('Dataset uploaded successfully');
      await loadDatasets(); // Refresh datasets
      return response.data.dataset;
    } catch (error: any) {
      toast.error(`Failed to upload dataset: ${error.message}`);
      throw error;
    }
  }, [api]);

  // Get training status
  const getTrainingStatus = useCallback(async (jobId: string) => {
    try {
      const response = await api.get(`/api/ai-lab/status/${jobId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get training status:', error);
      return null;
    }
  }, [api]);

  // Export model
  const exportModel = useCallback(async (modelId: string) => {
    try {
      const response = await api.get(`/api/ai-lab/export/${modelId}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `model-${modelId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Model exported successfully');
    } catch (error: any) {
      toast.error(`Failed to export model: ${error.message}`);
      throw error;
    }
  }, [api]);

  // Import model
  const importModel = useCallback(async (file: File, metadata: {
    name: string;
    type: 'tts' | 'stt' | 'nlp' | 'cv' | 'custom';
  }) => {
    try {
      const formData = new FormData();
      formData.append('model', file);
      formData.append('name', metadata.name);
      formData.append('type', metadata.type);

      const response = await api.post('/api/ai-lab/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Model imported successfully');
      await loadModels(); // Refresh models
      return response.data.model;
    } catch (error: any) {
      toast.error(`Failed to import model: ${error.message}`);
      throw error;
    }
  }, [api]);

  // Load datasets
  const loadDatasets = useCallback(async () => {
    try {
      const response = await api.get('/api/ai-lab/datasets');
      setDatasets(response.data.datasets);
    } catch (error: any) {
      console.error('Failed to load datasets:', error);
    }
  }, [api]);

  // Load models
  const loadModels = useCallback(async () => {
    try {
      const response = await api.get('/api/ai-lab/models');
      setModels([
        ...response.data.trainedModels,
        ...response.data.ttsModels
      ]);
    } catch (error: any) {
      console.error('Failed to load models:', error);
    }
  }, [api]);

  // Run inference
  const runInference = useCallback(async (modelId: string, input: string, type: 'text' | 'audio' = 'text') => {
    try {
      const response = await api.post('/api/ai-lab/inference', {
        modelId,
        input,
        type
      });
      
      return response.data.result;
    } catch (error: any) {
      toast.error(`Failed to run inference: ${error.message}`);
      throw error;
    }
  }, [api]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<AILabSettings>) => {
    try {
      const response = await api.post('/api/ai-lab/settings', newSettings);
      setSettings(response.data.settings);
      toast.success('Settings updated successfully');
    } catch (error: any) {
      toast.error(`Failed to update settings: ${error.message}`);
      throw error;
    }
  }, [api]);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      const response = await api.get('/api/ai-lab/settings');
      setSettings(response.data);
    } catch (error: any) {
      console.error('Failed to load settings:', error);
    }
  }, [api]);

  // Load initial data
  useEffect(() => {
    loadDatasets();
    loadModels();
    loadSettings();
  }, [loadDatasets, loadModels, loadSettings]);

  return {
    // State
    activeJobs: Array.from(activeJobs.values()),
    datasets,
    models,
    settings,
    isConnected,
    
    // Actions
    startTraining,
    uploadDataset,
    getTrainingStatus,
    exportModel,
    importModel,
    runInference,
    updateSettings,
    
    // Refresh functions
    refreshDatasets: loadDatasets,
    refreshModels: loadModels,
    refreshSettings: loadSettings
  };
}