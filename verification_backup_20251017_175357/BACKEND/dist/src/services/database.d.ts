/**
 * JSON-based Database Service
 * Replaces SQLite with file-based JSON storage for simplicity
 */
export interface TrainingRun {
    id: string;
    started_at: string;
    finished_at?: string;
    status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';
    total_epochs: number;
    current_epoch: number;
    total_steps: number;
    current_step: number;
    best_metric?: number;
    best_checkpoint_id?: string;
    notes?: string;
    config: string;
}
export interface Checkpoint {
    id: string;
    run_id: string;
    created_at: string;
    path: string;
    tag?: 'latest' | 'best' | 'manual';
    metric?: number;
    resume_token?: string;
}
declare class DatabaseService {
    private dbPath;
    private data;
    constructor(dbPath?: string);
    private initialize;
    private save;
    createTrainingRun(run: Omit<TrainingRun, 'id'>): TrainingRun;
    getTrainingRun(id: string): TrainingRun | null;
    getAllTrainingRuns(): TrainingRun[];
    updateTrainingRun(id: string, updates: Partial<TrainingRun>): TrainingRun | null;
    deleteTrainingRun(id: string): boolean;
    createCheckpoint(checkpoint: Omit<Checkpoint, 'id'>): Checkpoint;
    getCheckpointsByRunId(runId: string): Checkpoint[];
    getCheckpoint(id: string): Checkpoint | null;
    updateCheckpoint(id: string, updates: Partial<Checkpoint>): Checkpoint | null;
    deleteCheckpoint(id: string): boolean;
    getStats(): {
        runs: number;
        checkpoints: number;
        lastUpdated: string;
    };
    clearAll(): void;
}
export declare const database: DatabaseService;
export default database;
//# sourceMappingURL=database.d.ts.map