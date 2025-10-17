import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/shared/utils/api';

interface Model {
  id: string;
  name: string;
  type: string;
  size: number;
  status: string;
  createdAt: string;
}

export function useModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<Model[]>('/api/models');
      
      if (response.success) {
        setModels(response.data);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch models');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch models';
      setError(errorMessage);
      console.error('Models fetch error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadModel = useCallback(async (modelId: string) => {
    try {
      const response = await apiService.post(`/api/models/${modelId}/download`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to download model');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to download model';
      console.error('Model download error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteModel = useCallback(async (modelId: string) => {
    try {
      const response = await apiService.delete(`/api/models/${modelId}`);
      
      if (response.success) {
        await fetchModels(); // Refresh the list
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete model');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete model';
      console.error('Model deletion error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchModels]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
    downloadModel,
    deleteModel,
  };
}
