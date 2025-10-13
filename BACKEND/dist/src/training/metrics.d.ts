import TrainingStateManager, { TrainingMetric } from './state';
export declare class MetricsService {
    private state;
    constructor(state: TrainingStateManager);
    record(runId: string, data: Omit<TrainingMetric, 'ts' | 'runId'> & {
        ts?: number;
    }): TrainingMetric;
    list(runId?: string): TrainingMetric[] | Record<string, TrainingMetric[]>;
    latest(runId: string): TrainingMetric | null;
    summary(runId: string): {
        runId: string;
        count: number;
        minLoss: number;
        maxLoss: number;
        avgLoss: number;
        avgAcc: number | undefined;
    } | null;
    eta(runId: string, targetEpochs: number): {
        msPerEpoch: number;
        remainingEpochs: number;
        etaAt: number;
    } | null;
    getLatestMetrics(runId: string): Promise<TrainingMetric[]>;
    recordMetric(runId: string, epoch: number, step: number, loss: number, valLoss?: number, accuracy?: number): Promise<void>;
}
export default MetricsService;
//# sourceMappingURL=metrics.d.ts.map