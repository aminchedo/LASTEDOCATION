import { TrainingStatus, AILabSettings } from '../../types/ai-lab';
export declare class AILabService {
    private trainingJobs;
    private storageBasePath;
    private settings;
    constructor();
    private initializeStorage;
    private detectGPU;
    startTraining(config: any): Promise<string>;
    private runTraining;
    private prepareData;
    private saveCheckpoint;
    private saveModel;
    getTrainingStatus(jobId: string): Promise<TrainingStatus | null>;
    updateSettings(userId: string, settings: Partial<AILabSettings>): Promise<AILabSettings>;
    getSettings(userId: string): Promise<AILabSettings>;
}
//# sourceMappingURL=AILabService.d.ts.map