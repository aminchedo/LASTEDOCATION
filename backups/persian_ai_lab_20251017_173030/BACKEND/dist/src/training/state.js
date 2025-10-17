"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingStateManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const DEFAULT_STATE = { runs: {}, metrics: {}, logs: {}, checkpoints: {} };
class TrainingStateManager {
    constructor(filePath = path_1.default.join(process.cwd(), 'training_state.json')) {
        this.filePath = filePath;
        this.state = DEFAULT_STATE;
        this.load();
    }
    ensureDir() {
        try {
            const dir = path_1.default.dirname(this.filePath);
            if (!fs_1.default.existsSync(dir))
                fs_1.default.mkdirSync(dir, { recursive: true });
        }
        catch (e) {
            logger_1.logger.error(`Failed to ensure state dir: ${String(e?.message || e)}`);
        }
    }
    load() {
        this.ensureDir();
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf-8');
                this.state = JSON.parse(raw);
            }
            else {
                this.persist();
            }
        }
        catch (e) {
            logger_1.logger.error(`Failed to load training state: ${String(e?.message || e)}`);
            this.state = DEFAULT_STATE;
        }
    }
    persist() {
        try {
            this.ensureDir();
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
        }
        catch (e) {
            logger_1.logger.error(`Failed to persist training state: ${String(e?.message || e)}`);
        }
    }
    createRun(runId, modelName, targetEpochs) {
        const now = new Date().toISOString();
        const meta = {
            runId,
            id: runId, // Alias for runId
            modelName,
            createdAt: now,
            updatedAt: now,
            phase: 'idle',
            status: 'idle', // Alias for phase
            currentEpoch: 0,
            currentStep: 0,
            targetEpochs,
            totalEpochs: targetEpochs, // Alias for targetEpochs
            totalSteps: 0,
            bestMetric: undefined,
            startedAt: undefined,
            finishedAt: undefined
        };
        this.state.runs[runId] = meta;
        this.state.metrics[runId] = [];
        this.state.logs[runId] = [];
        this.state.checkpoints[runId] = [];
        this.persist();
        return meta;
    }
    updateRun(runId, patch) {
        const meta = this.state.runs[runId];
        if (!meta)
            return null;
        // Sync aliases
        const syncedPatch = { ...patch };
        if (patch.phase !== undefined) {
            syncedPatch.status = patch.phase;
        }
        if (patch.targetEpochs !== undefined) {
            syncedPatch.totalEpochs = patch.targetEpochs;
        }
        const updated = { ...meta, ...syncedPatch, updatedAt: new Date().toISOString() };
        this.state.runs[runId] = updated;
        this.persist();
        return updated;
    }
    appendMetric(metric) {
        if (!this.state.metrics[metric.runId])
            this.state.metrics[metric.runId] = [];
        this.state.metrics[metric.runId].push(metric);
        this.persist();
    }
    getMetrics(runId) {
        return this.state.metrics[runId] || [];
    }
    getLatestMetric(runId) {
        const list = this.getMetrics(runId);
        return list.length ? list[list.length - 1] : null;
    }
    listRuns() {
        return Object.values(this.state.runs).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    addLog(runId, line) {
        if (!this.state.logs[runId])
            this.state.logs[runId] = [];
        this.state.logs[runId].push(line);
        if (this.state.logs[runId].length > 2000)
            this.state.logs[runId].shift();
        this.persist();
    }
    getLogs(runId, limit = 200) {
        const lines = this.state.logs[runId] || [];
        return lines.slice(-limit);
    }
    addCheckpoint(runId, filePath) {
        if (!this.state.checkpoints[runId])
            this.state.checkpoints[runId] = [];
        this.state.checkpoints[runId].push(filePath);
        this.updateRun(runId, { lastCheckpointPath: filePath });
        this.persist();
    }
    getCheckpoints(runId) {
        return this.state.checkpoints[runId] || [];
    }
    // Additional methods needed by trainer
    getCurrentRun() {
        const runs = this.listRuns();
        const activeRun = runs.find(run => run.phase === 'running' || run.phase === 'paused');
        return activeRun || null;
    }
    errorRun(errorMessage) {
        const currentRun = this.getCurrentRun();
        if (currentRun) {
            this.updateRun(currentRun.runId, { phase: 'error' });
            this.addLog(currentRun.runId, `ERROR: ${errorMessage}`);
        }
    }
    async pauseRun() {
        const currentRun = this.getCurrentRun();
        if (currentRun) {
            this.updateRun(currentRun.runId, { phase: 'paused' });
        }
    }
    async resumeRun() {
        const currentRun = this.getCurrentRun();
        if (currentRun) {
            this.updateRun(currentRun.runId, { phase: 'running' });
        }
    }
    async stopRun() {
        const currentRun = this.getCurrentRun();
        if (currentRun) {
            this.updateRun(currentRun.runId, { phase: 'stopped' });
        }
    }
    async completeRun() {
        const currentRun = this.getCurrentRun();
        if (currentRun) {
            this.updateRun(currentRun.runId, { phase: 'completed' });
        }
    }
    async createCheckpoint(runId, checkpointId, _tag) {
        const checkpointPath = `checkpoints/${runId}/${checkpointId}`;
        this.addCheckpoint(runId, checkpointPath);
    }
    async updateBestCheckpoint(checkpointId) {
        const currentRun = this.getCurrentRun();
        if (currentRun) {
            this.updateRun(currentRun.runId, { lastCheckpointPath: checkpointId });
        }
    }
    async updateProgress(epoch, _step) {
        const currentRun = this.getCurrentRun();
        if (currentRun) {
            this.updateRun(currentRun.runId, { currentEpoch: epoch });
        }
    }
}
exports.TrainingStateManager = TrainingStateManager;
exports.default = TrainingStateManager;
//# sourceMappingURL=state.js.map