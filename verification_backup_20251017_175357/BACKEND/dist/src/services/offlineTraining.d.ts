/**
 * Offline Training Service
 * Handles offline model training with dataset management
 */
export interface TrainingJob {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
    datasetId: string;
    baseModelId?: string;
    config: TrainingConfig;
    progress: {
        epoch: number;
        step: number;
        totalEpochs: number;
        totalSteps: number;
        percentage: number;
    };
    metrics: {
        loss: number;
        accuracy: number;
        perplexity?: number;
        bleu?: number;
        rouge?: number;
    };
    logs: string[];
    startedAt: string;
    completedAt?: string;
    error?: string;
    outputPath?: string;
}
export interface TrainingConfig {
    modelType: 'llm' | 'stt' | 'tts' | 'embedding' | 'classification';
    architecture: string;
    hiddenSize: number;
    numLayers: number;
    numHeads: number;
    vocabSize: number;
    epochs: number;
    batchSize: number;
    learningRate: number;
    weightDecay: number;
    warmupSteps: number;
    maxSteps?: number;
    gradientAccumulationSteps: number;
    maxGradNorm: number;
    trainSplit: number;
    valSplit: number;
    testSplit: number;
    maxSequenceLength: number;
    dataAugmentation: boolean;
    optimizer: 'adam' | 'adamw' | 'sgd' | 'rmsprop';
    scheduler: 'linear' | 'cosine' | 'constant' | 'polynomial';
    mixedPrecision: boolean;
    gradientCheckpointing: boolean;
    useGPU: boolean;
    numGPUs: number;
    cpuOnly: boolean;
    outputDir: string;
    saveSteps: number;
    evalSteps: number;
    loggingSteps: number;
    saveTotalLimit: number;
}
export interface TrainingMetrics {
    epoch: number;
    step: number;
    loss: number;
    accuracy: number;
    perplexity?: number;
    bleu?: number;
    rouge?: number;
    learningRate: number;
    gradientNorm: number;
    timestamp: string;
}
declare class OfflineTrainingService {
    private jobs;
    private jobsPath;
    private trainingPath;
    constructor();
    private initialize;
    private loadJobs;
    private saveJobs;
    private generateTrainingScript;
    createTrainingJob(name: string, datasetId: string, config: TrainingConfig, baseModelId?: string): Promise<TrainingJob>;
    startTraining(jobId: string): Promise<boolean>;
    private runTrainingProcess;
    private parseProgressFromLog;
    getTrainingJob(jobId: string): TrainingJob | null;
    getAllTrainingJobs(): TrainingJob[];
    pauseTraining(jobId: string): boolean;
    resumeTraining(jobId: string): boolean;
    cancelTraining(jobId: string): boolean;
    deleteTrainingJob(jobId: string): boolean;
    getStats(): {
        totalJobs: number;
        runningJobs: number;
        completedJobs: number;
        failedJobs: number;
        totalTrainingTime: number;
    };
}
export declare const offlineTrainingService: OfflineTrainingService;
export default offlineTrainingService;
//# sourceMappingURL=offlineTraining.d.ts.map