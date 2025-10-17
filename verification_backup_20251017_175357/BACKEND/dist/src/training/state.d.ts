export type TrainingPhase = 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';
export interface TrainingRunMeta {
    runId: string;
    id: string;
    modelName: string;
    createdAt: string;
    updatedAt: string;
    phase: TrainingPhase;
    status: TrainingPhase;
    currentEpoch: number;
    currentStep: number;
    targetEpochs: number;
    totalEpochs: number;
    totalSteps: number;
    bestMetric?: number;
    startedAt?: string;
    finishedAt?: string;
    lastCheckpointPath?: string;
}
export interface TrainingMetric {
    runId: string;
    ts: number;
    epoch: number;
    step: number;
    loss: number;
    valLoss?: number;
    accuracy?: number;
    learningRate?: number;
}
export declare class TrainingStateManager {
    private filePath;
    private state;
    constructor(filePath?: string);
    private ensureDir;
    private load;
    private persist;
    createRun(runId: string, modelName: string, targetEpochs: number): TrainingRunMeta;
    updateRun(runId: string, patch: Partial<TrainingRunMeta>): TrainingRunMeta | null;
    appendMetric(metric: TrainingMetric): void;
    getMetrics(runId: string): TrainingMetric[];
    getLatestMetric(runId: string): TrainingMetric | null;
    listRuns(): TrainingRunMeta[];
    addLog(runId: string, line: string): void;
    getLogs(runId: string, limit?: number): string[];
    addCheckpoint(runId: string, filePath: string): void;
    getCheckpoints(runId: string): string[];
    getCurrentRun(): TrainingRunMeta | null;
    errorRun(errorMessage: string): void;
    pauseRun(): Promise<void>;
    resumeRun(): Promise<void>;
    stopRun(): Promise<void>;
    completeRun(): Promise<void>;
    createCheckpoint(runId: string, checkpointId: string, _tag: string): Promise<void>;
    updateBestCheckpoint(checkpointId: string): Promise<void>;
    updateProgress(epoch: number, _step: number): Promise<void>;
}
export default TrainingStateManager;
//# sourceMappingURL=state.d.ts.map