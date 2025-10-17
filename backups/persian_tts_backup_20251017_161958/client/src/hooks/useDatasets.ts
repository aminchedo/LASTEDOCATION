import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/shared/utils/api';

interface Dataset {
  id: string;
  name: string;
  type: string;
  size: number;
  samples: number;
  createdAt: string;
}

export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<Dataset[]>('/api/datasets');
      
      if (response.success) {
        setDatasets(response.data);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch datasets');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch datasets';
      setError(errorMessage);
      console.error('Datasets fetch error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDataset = useCallback(async (file: File, metadata: any) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await apiService.post('/api/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.success) {
        await fetchDatasets(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to upload dataset');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload dataset';
      console.error('Dataset upload error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchDatasets]);

  const deleteDataset = useCallback(async (datasetId: string) => {
    try {
      const response = await apiService.delete(`/api/datasets/${datasetId}`);
      
      if (response.success) {
        await fetchDatasets(); // Refresh the list
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete dataset');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete dataset';
      console.error('Dataset deletion error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchDatasets]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  return {
    datasets,
    loading,
    error,
    refetch: fetchDatasets,
    uploadDataset,
    deleteDataset,
  };
}
