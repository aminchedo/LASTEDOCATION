"use strict";
/**
 * JSON-based Database Service
 * Replaces SQLite with file-based JSON storage for simplicity
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../middleware/logger");
class DatabaseService {
    constructor(dbPath = path_1.default.join(process.cwd(), 'data', 'database.json')) {
        this.dbPath = dbPath;
        this.data = {
            training_runs: [],
            checkpoints: []
        };
        this.initialize();
    }
    initialize() {
        try {
            // Ensure directory exists
            const dir = path_1.default.dirname(this.dbPath);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            // Load existing data
            if (fs_1.default.existsSync(this.dbPath)) {
                const rawData = fs_1.default.readFileSync(this.dbPath, 'utf-8');
                this.data = JSON.parse(rawData);
            }
            else {
                this.save();
            }
            logger_1.logger.info({ msg: 'database_initialized', path: this.dbPath });
        }
        catch (error) {
            logger_1.logger.error({ msg: 'database_init_failed', error: error.message });
            throw error;
        }
    }
    save() {
        try {
            fs_1.default.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (error) {
            logger_1.logger.error({ msg: 'database_save_failed', error: error.message });
            throw error;
        }
    }
    // Training Runs
    createTrainingRun(run) {
        const newRun = {
            id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...run
        };
        this.data.training_runs.push(newRun);
        this.save();
        logger_1.logger.info({ msg: 'training_run_created', id: newRun.id });
        return newRun;
    }
    getTrainingRun(id) {
        return this.data.training_runs.find(run => run.id === id) || null;
    }
    getAllTrainingRuns() {
        return this.data.training_runs.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }
    updateTrainingRun(id, updates) {
        const index = this.data.training_runs.findIndex(run => run.id === id);
        if (index === -1)
            return null;
        this.data.training_runs[index] = { ...this.data.training_runs[index], ...updates };
        this.save();
        logger_1.logger.info({ msg: 'training_run_updated', id });
        return this.data.training_runs[index];
    }
    deleteTrainingRun(id) {
        const index = this.data.training_runs.findIndex(run => run.id === id);
        if (index === -1)
            return false;
        this.data.training_runs.splice(index, 1);
        this.save();
        logger_1.logger.info({ msg: 'training_run_deleted', id });
        return true;
    }
    // Checkpoints
    createCheckpoint(checkpoint) {
        const newCheckpoint = {
            id: `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...checkpoint
        };
        this.data.checkpoints.push(newCheckpoint);
        this.save();
        logger_1.logger.info({ msg: 'checkpoint_created', id: newCheckpoint.id });
        return newCheckpoint;
    }
    getCheckpointsByRunId(runId) {
        return this.data.checkpoints
            .filter(checkpoint => checkpoint.run_id === runId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    getCheckpoint(id) {
        return this.data.checkpoints.find(checkpoint => checkpoint.id === id) || null;
    }
    updateCheckpoint(id, updates) {
        const index = this.data.checkpoints.findIndex(checkpoint => checkpoint.id === id);
        if (index === -1)
            return null;
        this.data.checkpoints[index] = { ...this.data.checkpoints[index], ...updates };
        this.save();
        logger_1.logger.info({ msg: 'checkpoint_updated', id });
        return this.data.checkpoints[index];
    }
    deleteCheckpoint(id) {
        const index = this.data.checkpoints.findIndex(checkpoint => checkpoint.id === id);
        if (index === -1)
            return false;
        this.data.checkpoints.splice(index, 1);
        this.save();
        logger_1.logger.info({ msg: 'checkpoint_deleted', id });
        return true;
    }
    // Utility methods
    getStats() {
        return {
            runs: this.data.training_runs.length,
            checkpoints: this.data.checkpoints.length,
            lastUpdated: new Date().toISOString()
        };
    }
    clearAll() {
        this.data = {
            training_runs: [],
            checkpoints: []
        };
        this.save();
        logger_1.logger.info({ msg: 'database_cleared' });
    }
}
// Export singleton instance
exports.database = new DatabaseService();
exports.default = exports.database;
//# sourceMappingURL=database.js.map