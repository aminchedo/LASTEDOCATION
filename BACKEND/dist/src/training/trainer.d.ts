/**
 * Real CPU-safe baseline trainer for single-model training
 * Implements a simple but functional training loop with real gradients
 */
import { TrainingStorage } from './storage';
import MetricsService from './metrics';
import { TrainingStateManager } from './state';
export interface TrainingConfig {
    totalEpochs: number;
    totalSteps: number;
    learningRate: number;
    batchSize: number;
    saveEverySteps: number;
    resumeCheckpointId?: string;
}
export interface TrainingCallbacks {
    onStepEnd?: (epoch: number, step: number, loss: number, accuracy?: number) => void;
    onEpochEnd?: (epoch: number, avgLoss: number, avgAccuracy?: number) => void;
    onCheckpoint?: (checkpointId: string, tag: string, metric: number) => void;
}
export declare class CPUTrainer {
    private storage;
    private metrics;
    private state;
    private isTraining;
    private isPaused;
    private currentConfig?;
    private callbacks?;
    private weights;
    private biases;
    private optimizerState;
    private vocabSize;
    private hiddenSize;
    constructor(storage: TrainingStorage, metrics: MetricsService, state: TrainingStateManager);
    initialize(): Promise<void>;
    start(config: TrainingConfig, callbacks?: TrainingCallbacks): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    stop(): Promise<void>;
    saveCheckpoint(tag: 'latest' | 'best' | 'manual'): Promise<string>;
    loadCheckpoint(checkpointId: string): Promise<void>;
    private initializeModel;
    private trainingLoop;
    private trainingStep;
    private generateSyntheticBatch;
    private forwardLayer;
    private relu;
    private softmax;
    private calculateLoss;
    private calculateAccuracy;
    private backwardPass;
    private updateWeights;
    private waitForResume;
    getStatus(): {
        isTraining: boolean;
        isPaused: boolean;
        currentEpoch?: number;
        currentStep?: number;
    };
}
//# sourceMappingURL=trainer.d.ts.map