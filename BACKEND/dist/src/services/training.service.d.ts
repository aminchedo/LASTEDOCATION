import { EventEmitter } from 'events';
export interface TrainingConfig {
    modelType: string;
    datasetId: string;
    epochs: number;
    batchSize: number;
    learningRate: number;
    validationSplit: number;
    optimizer?: 'adam' | 'sgd' | 'rmsprop';
    lossFunction?: string;
}
export interface TrainingMetrics {
    epoch: number;
    step: number;
    totalSteps: number;
    loss: number;
    accuracy?: number;
    valLoss?: number;
    valAccuracy?: number;
    learningRate?: number;
}
export interface TrainingJob {
    id: string;
    userId: string;
    modelId: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    config: TrainingConfig;
    metrics?: TrainingMetrics;
    errorMessage?: string;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
}
export declare class TrainingService extends EventEmitter {
    private activeJobs;
    /**
     * Create a new training job
     */
    createTrainingJob(userId: string, modelId: string, config: TrainingConfig): Promise<string>;
    /**
     * Execute training
     */
    private executeTraining;
    /**
     * Create a model based on type
     */
    private createModel;
    /**
     * Get optimizer
     */
    private getOptimizer;
    /**
     * Load dataset from file
     */
    private loadDataset;
    /**
     * Save checkpoint
     */
    private saveCheckpoint;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<TrainingJob | null>;
    /**
     * Get all jobs for a user
     */
    getUserJobs(userId: string): Promise<TrainingJob[]>;
    /**
     * Cancel a training job
     */
    cancelJob(jobId: string): Promise<boolean>;
}
export declare const trainingService: TrainingService;
//# sourceMappingURL=training.service.d.ts.map