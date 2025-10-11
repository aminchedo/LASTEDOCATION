import { TrainingJob, TrainingConfig } from '../types/train';
export declare function startTrainingJob(name: string, config: TrainingConfig): Promise<TrainingJob>;
export declare function getTrainingJob(jobId: string): TrainingJob | null;
export declare function getAllTrainingJobs(): TrainingJob[];
export declare function cancelTrainingJob(jobId: string): boolean;
export declare function getTrainingLogs(jobId: string, limit?: number): string[];
//# sourceMappingURL=train.d.ts.map