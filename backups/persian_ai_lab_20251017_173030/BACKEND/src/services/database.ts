/**
 * JSON-based Database Service
 * Replaces SQLite with file-based JSON storage for simplicity
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';

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
    config: string; // JSON string
}

export interface Checkpoint {
    id: string;
    run_id: string;
    created_at: string;
    path: string;
    tag?: 'latest' | 'best' | 'manual';
    metric?: number;
    resume_token?: string; // JSON string
}

class DatabaseService {
    private dbPath: string;
    private data: {
        training_runs: TrainingRun[];
        checkpoints: Checkpoint[];
    };

    constructor(dbPath: string = path.join(process.cwd(), 'data', 'database.json')) {
        this.dbPath = dbPath;
        this.data = {
            training_runs: [],
            checkpoints: []
        };
        this.initialize();
    }

    private initialize(): void {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Load existing data
            if (fs.existsSync(this.dbPath)) {
                const rawData = fs.readFileSync(this.dbPath, 'utf-8');
                this.data = JSON.parse(rawData);
            } else {
                this.save();
            }

            logger.info({ msg: 'database_initialized', path: this.dbPath });
        } catch (error: any) {
            logger.error({ msg: 'database_init_failed', error: error.message });
            throw error;
        }
    }

    private save(): void {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
        } catch (error: any) {
            logger.error({ msg: 'database_save_failed', error: error.message });
            throw error;
        }
    }

    // Training Runs
    createTrainingRun(run: Omit<TrainingRun, 'id'>): TrainingRun {
        const newRun: TrainingRun = {
            id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...run
        };

        this.data.training_runs.push(newRun);
        this.save();

        logger.info({ msg: 'training_run_created', id: newRun.id });
        return newRun;
    }

    getTrainingRun(id: string): TrainingRun | null {
        return this.data.training_runs.find(run => run.id === id) || null;
    }

    getAllTrainingRuns(): TrainingRun[] {
        return this.data.training_runs.sort((a, b) =>
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
    }

    updateTrainingRun(id: string, updates: Partial<TrainingRun>): TrainingRun | null {
        const index = this.data.training_runs.findIndex(run => run.id === id);
        if (index === -1) return null;

        this.data.training_runs[index] = { ...this.data.training_runs[index], ...updates };
        this.save();

        logger.info({ msg: 'training_run_updated', id });
        return this.data.training_runs[index];
    }

    deleteTrainingRun(id: string): boolean {
        const index = this.data.training_runs.findIndex(run => run.id === id);
        if (index === -1) return false;

        this.data.training_runs.splice(index, 1);
        this.save();

        logger.info({ msg: 'training_run_deleted', id });
        return true;
    }

    // Checkpoints
    createCheckpoint(checkpoint: Omit<Checkpoint, 'id'>): Checkpoint {
        const newCheckpoint: Checkpoint = {
            id: `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...checkpoint
        };

        this.data.checkpoints.push(newCheckpoint);
        this.save();

        logger.info({ msg: 'checkpoint_created', id: newCheckpoint.id });
        return newCheckpoint;
    }

    getCheckpointsByRunId(runId: string): Checkpoint[] {
        return this.data.checkpoints
            .filter(checkpoint => checkpoint.run_id === runId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    getCheckpoint(id: string): Checkpoint | null {
        return this.data.checkpoints.find(checkpoint => checkpoint.id === id) || null;
    }

    updateCheckpoint(id: string, updates: Partial<Checkpoint>): Checkpoint | null {
        const index = this.data.checkpoints.findIndex(checkpoint => checkpoint.id === id);
        if (index === -1) return null;

        this.data.checkpoints[index] = { ...this.data.checkpoints[index], ...updates };
        this.save();

        logger.info({ msg: 'checkpoint_updated', id });
        return this.data.checkpoints[index];
    }

    deleteCheckpoint(id: string): boolean {
        const index = this.data.checkpoints.findIndex(checkpoint => checkpoint.id === id);
        if (index === -1) return false;

        this.data.checkpoints.splice(index, 1);
        this.save();

        logger.info({ msg: 'checkpoint_deleted', id });
        return true;
    }

    // Utility methods
    getStats(): { runs: number; checkpoints: number; lastUpdated: string } {
        return {
            runs: this.data.training_runs.length,
            checkpoints: this.data.checkpoints.length,
            lastUpdated: new Date().toISOString()
        };
    }

    clearAll(): void {
        this.data = {
            training_runs: [],
            checkpoints: []
        };
        this.save();
        logger.info({ msg: 'database_cleared' });
    }
}

// Export singleton instance
export const database = new DatabaseService();
export default database;
