export interface TrainingConfig {
    baseModelPath: string;
    datasetPath: string;
    outputDir: string;
    epochs: number;
    learningRate: number;
    batchSize: number;
    maxSteps?: number;
    warmupSteps?: number;
    saveSteps?: number;
    evalSteps?: number;
    seed?: number;
    useGpu?: boolean;
}
export interface TrainingMetrics {
    epoch?: number;
    step: number;
    totalSteps: number;
    loss: number;
    learningRate?: number;
    samplesPerSecond?: number;
    accuracy?: number;
    perplexity?: number;
    evalLoss?: number;
}
export type TrainingStatus = 'pending' | 'preparing' | 'training' | 'evaluating' | 'completed' | 'error' | 'cancelled';
export interface TrainingJob {
    id: string;
    name: string;
    config: TrainingConfig;
    status: TrainingStatus;
    progress: number;
    currentPhase: string;
    metrics?: TrainingMetrics;
    error?: string;
    logs: string[];
    startedAt?: string;
    finishedAt?: string;
    estimatedTimeRemaining?: number;
}
//# sourceMappingURL=train.d.ts.map