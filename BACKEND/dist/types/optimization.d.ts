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
export interface ModelComparison {
    id: string;
    name: string;
    models: {
        id: string;
        name: string;
        path: string;
        metrics: Record<string, number>;
        size: number;
        inferenceTime: number;
    }[];
    testDataset: string;
    comparisonMetrics: string[];
    createdAt: string;
    results?: ComparisonResult[];
}
export interface ComparisonResult {
    modelId: string;
    modelName: string;
    metrics: Record<string, number>;
    ranking: number;
    performance: 'excellent' | 'good' | 'average' | 'poor';
}
export interface PruningConfig {
    method: 'magnitude' | 'gradient' | 'random';
    sparsity: number;
    structured: boolean;
    gradual: boolean;
}
export interface QuantizationConfig {
    method: 'dynamic' | 'static' | 'qat';
    bits: 8 | 16 | 32;
    calibrationDataset?: string;
    symmetric: boolean;
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
//# sourceMappingURL=optimization.d.ts.map