/**
 * Storage management for training models, checkpoints, and logs
 * Handles file system operations for the single-model training system
 */
export interface CheckpointInfo {
    id: string;
    runId: string;
    createdAt: string;
    path: string;
    tag: 'latest' | 'best' | 'manual';
    metric?: number;
    resumeToken?: string;
}
export interface ModelConfig {
    vocabSize: number;
    hiddenSize: number;
    numLayers: number;
    learningRate: number;
    batchSize: number;
    epochs: number;
    saveEverySteps: number;
}
export declare class TrainingStorage {
    private readonly modelsDir;
    private readonly logsDir;
    private readonly checkpointsDir;
    constructor(baseDir?: string);
    initialize(): Promise<void>;
    getModelConfig(): Promise<ModelConfig>;
    updateModelConfig(config: Partial<ModelConfig>): Promise<void>;
    saveCheckpoint(runId: string, checkpointId: string, weights: any, resumeToken: any, tag: 'latest' | 'best' | 'manual', metric?: number): Promise<string>;
    loadCheckpoint(checkpointId: string): Promise<any>;
    listCheckpoints(runId?: string): Promise<CheckpointInfo[]>;
    deleteCheckpoint(checkpointId: string): Promise<void>;
    appendMetrics(metrics: any): Promise<void>;
    readMetrics(sinceId?: string): Promise<any[]>;
    appendLog(level: 'info' | 'warn' | 'error', message: string, data?: any): Promise<void>;
    getLogs(limit?: number): Promise<any[]>;
    getStorageInfo(): Promise<{
        modelsDir: string;
        logsDir: string;
        checkpointsDir: string;
    }>;
}
//# sourceMappingURL=storage.d.ts.map