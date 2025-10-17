import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/core/contexts/ThemeContext';

export interface DetectedModel {
    id: string;
    name: string;
    type: 'model' | 'tts' | 'dataset' | 'unknown';
    modelFormat: 'onnx' | 'pytorch' | 'tensorflow' | 'safetensors' | 'ggml' | 'gguf' | 'bin' | 'unknown';
    path: string;
    size: number;
    files: string[];
    configFile?: string;
    description?: string;
    architecture?: string;
    language?: string[];
    lastModified: string;
    metadata?: Record<string, any>;
    // Training-specific fields
    isTrainedModel: boolean;
    baseModel?: string;
    trainingInfo?: {
        epochs?: number;
        steps?: number;
        learningRate?: number;
        batchSize?: number;
        lossFunction?: string;
        optimizer?: string;
        trainedOn?: string[];  // datasets used for training
        trainingDate?: string;
        checkpoints?: string[];
        bestCheckpoint?: string;
        metrics?: {
            finalLoss?: number;
            finalAccuracy?: number;
            bestLoss?: number;
            bestAccuracy?: number;
        };
    };
    // Dataset tags and labels
    tags?: string[];
    domain?: string;
    license?: string;
    compatibility?: string[];  // compatible model formats/frameworks
}

export interface ModelStatistics {
    total_models: number;
    by_type: {
        model: number;
        tts: number;
        dataset: number;
        unknown: number;
    };
    by_format: {
        pytorch: number;
        onnx: number;
        safetensors: number;
        gguf: number;
        bin: number;
        other: number;
    };
}

export interface UseDetectedModelsResult {
    models: DetectedModel[];
    statistics: ModelStatistics | null;
    loading: boolean;
    error: string | null;
    scannedDirectories: string[];
    configuration: {
        customFolders: string[];
        scanDepth: number;
        autoScan: boolean;
    } | null;
    refetch: () => void;
    scanDirectories: (folders: string[], options?: { maxDepth?: number; includeHidden?: boolean }) => Promise<DetectedModel[]>;
    analyzeDirectory: (path: string) => Promise<{ isModelDirectory: boolean; models: DetectedModel[] }>;
    getDefaultDirectories: () => Promise<string[]>;
}

export function useDetectedModels(): UseDetectedModelsResult {
    const { settings } = useTheme();
    const [models, setModels] = useState<DetectedModel[]>([]);
    const [statistics, setStatistics] = useState<ModelStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scannedDirectories, setScannedDirectories] = useState<string[]>([]);
    const [configuration, setConfiguration] = useState<{
        customFolders: string[];
        scanDepth: number;
        autoScan: boolean;
    } | null>(null);

    const fetchDetectedModels = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const modelSettings = settings.models || { customFolders: [], autoScan: true, scanDepth: 2 };

            const params = new URLSearchParams({
                customFolders: JSON.stringify(modelSettings.customFolders),
                scanDepth: modelSettings.scanDepth.toString(),
                autoScan: modelSettings.autoScan.toString()
            });

            const token = localStorage.getItem('authToken');
            const response = await fetch(`${settings.api.baseUrl}/api/models/detected?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch detected models: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch detected models');
            }

            setModels(data.models || []);
            setStatistics(data.statistics || null);
            setScannedDirectories(data.scanned_directories || []);
            setConfiguration(data.configuration || null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load detected models';
            console.error('useDetectedModels error:', errorMessage);
            setError(errorMessage);
            setModels([]);
            setStatistics(null);
            setScannedDirectories([]);
            setConfiguration(null);
        } finally {
            setLoading(false);
        }
    }, [settings.api.baseUrl, settings.api.key, settings.models]);

    const scanDirectories = useCallback(async (
        folders: string[],
        options: { maxDepth?: number; includeHidden?: boolean } = {}
    ): Promise<DetectedModel[]> => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${settings.api.baseUrl}/api/models/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    folders,
                    maxDepth: options.maxDepth || 3,
                    includeHidden: options.includeHidden || false,
                    minSizeBytes: 1024 * 1024 // 1MB
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to scan directories: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to scan directories');
            }

            return data.models || [];
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to scan directories';
            console.error('scanDirectories error:', errorMessage);
            throw new Error(errorMessage);
        }
    }, [settings.api.baseUrl, settings.api.key]);

    const analyzeDirectory = useCallback(async (path: string): Promise<{ isModelDirectory: boolean; models: DetectedModel[] }> => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${settings.api.baseUrl}/api/models/analyze-directory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ path })
            });

            if (!response.ok) {
                throw new Error(`Failed to analyze directory: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to analyze directory');
            }

            return {
                isModelDirectory: data.is_model_directory || false,
                models: data.models || []
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to analyze directory';
            console.error('analyzeDirectory error:', errorMessage);
            throw new Error(errorMessage);
        }
    }, [settings.api.baseUrl, settings.api.key]);

    const getDefaultDirectories = useCallback(async (): Promise<string[]> => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${settings.api.baseUrl}/api/models/default-directories`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get default directories: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get default directories');
            }

            return data.directories || [];
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get default directories';
            console.error('getDefaultDirectories error:', errorMessage);
            throw new Error(errorMessage);
        }
    }, [settings.api.baseUrl, settings.api.key]);

    // Fetch models when settings change
    useEffect(() => {
        fetchDetectedModels();
    }, [fetchDetectedModels]);

    return {
        models,
        statistics,
        loading,
        error,
        scannedDirectories,
        configuration,
        refetch: fetchDetectedModels,
        scanDirectories,
        analyzeDirectory,
        getDefaultDirectories
    };
}
