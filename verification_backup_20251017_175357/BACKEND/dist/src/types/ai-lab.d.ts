export interface TrainingJob {
    id: string;
    userId: string;
    modelName: string;
    modelType: 'tts' | 'stt' | 'nlp' | 'cv' | 'custom';
    architecture: string;
    status: 'initializing' | 'loading_data' | 'preparing_data' | 'creating_model' | 'training' | 'saving_model' | 'completed' | 'failed';
    progress: number;
    currentEpoch?: number;
    totalEpochs?: number;
    startTime: Date;
    endTime?: Date;
    config: any;
    metrics: TrainingMetrics;
    modelPath?: string;
    error?: string;
    finalMetrics?: {
        loss: number;
        accuracy: number;
        validationLoss: number;
        validationAccuracy: number;
    };
}
export interface TrainingMetrics {
    loss: number[];
    accuracy: number[];
    validationLoss: number[];
    validationAccuracy: number[];
}
export interface TrainingStatus {
    jobId: string;
    status: string;
    progress: number;
    currentEpoch?: number;
    totalEpochs?: number;
    metrics: TrainingMetrics;
    startTime: Date;
    endTime?: Date;
    error?: string;
}
export interface Dataset {
    id: string;
    userId: string;
    name: string;
    type: 'text' | 'audio' | 'structured';
    description: string;
    originalFile: string;
    path: string;
    stats: {
        rows: number;
        columns?: number;
        size: number;
        tokens?: number;
        totalWords?: number;
        uniqueWords?: number;
        avgWordsPerRow?: number;
    };
    createdAt: Date;
    status: 'processing' | 'ready' | 'error';
    data?: any;
}
export interface DatasetInfo {
    userId: string;
    name: string;
    type: 'text' | 'audio' | 'structured';
    description?: string;
    filePath: string;
    originalName: string;
    size: number;
}
export interface Model {
    id: string;
    userId: string;
    name: string;
    type: 'tts' | 'stt' | 'nlp' | 'cv' | 'custom';
    architecture?: string;
    path: string;
    createdAt: Date;
    status: 'training' | 'ready' | 'error';
    inputShape?: number[];
    outputShape?: number[];
    parameters?: any;
}
export interface ModelInfo {
    userId: string;
    name: string;
    type: 'tts' | 'stt' | 'nlp' | 'cv' | 'custom';
    filePath: string;
}
export interface AILabSettings {
    userId: string;
    baseDirectory: string;
    gpuEnabled: boolean;
    maxConcurrentJobs: number;
    autoSaveCheckpoints: boolean;
    checkpointInterval: number;
}
//# sourceMappingURL=ai-lab.d.ts.map