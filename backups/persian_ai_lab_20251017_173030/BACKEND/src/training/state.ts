
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export type TrainingPhase = 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';

export interface TrainingRunMeta {
  runId: string;
  id: string; // Alias for runId
  modelName: string;
  createdAt: string;
  updatedAt: string;
  phase: TrainingPhase;
  status: TrainingPhase; // Alias for phase
  currentEpoch: number;
  currentStep: number;
  targetEpochs: number;
  totalEpochs: number; // Alias for targetEpochs
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

interface StateShape {
  runs: Record<string, TrainingRunMeta>;
  metrics: Record<string, TrainingMetric[]>;
  logs: Record<string, string[]>;
  checkpoints: Record<string, string[]>;
}

const DEFAULT_STATE: StateShape = { runs: {}, metrics: {}, logs: {}, checkpoints: {} };

export class TrainingStateManager {
  private filePath: string;
  private state: StateShape;

  constructor(filePath: string = path.join(process.cwd(), 'training_state.json')) {
    this.filePath = filePath;
    this.state = DEFAULT_STATE;
    this.load();
  }

  private ensureDir() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      logger.error(`Failed to ensure state dir: ${String((e as any)?.message || e)}`);
    }
  }

  private load() {
    this.ensureDir();
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.state = JSON.parse(raw) as StateShape;
      } else {
        this.persist();
      }
    } catch (e) {
      logger.error(`Failed to load training state: ${String((e as any)?.message || e)}`);
      this.state = DEFAULT_STATE;
    }
  }

  private persist() {
    try {
      this.ensureDir();
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      logger.error(`Failed to persist training state: ${String((e as any)?.message || e)}`);
    }
  }

  createRun(runId: string, modelName: string, targetEpochs: number): TrainingRunMeta {
    const now = new Date().toISOString();
    const meta: TrainingRunMeta = {
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

  updateRun(runId: string, patch: Partial<TrainingRunMeta>): TrainingRunMeta | null {
    const meta = this.state.runs[runId];
    if (!meta) return null;

    // Sync aliases
    const syncedPatch = { ...patch };
    if (patch.phase !== undefined) {
      syncedPatch.status = patch.phase;
    }
    if (patch.targetEpochs !== undefined) {
      syncedPatch.totalEpochs = patch.targetEpochs;
    }

    const updated: TrainingRunMeta = { ...meta, ...syncedPatch, updatedAt: new Date().toISOString() };
    this.state.runs[runId] = updated;
    this.persist();
    return updated;
  }

  appendMetric(metric: TrainingMetric) {
    if (!this.state.metrics[metric.runId]) this.state.metrics[metric.runId] = [];
    this.state.metrics[metric.runId].push(metric);
    this.persist();
  }

  getMetrics(runId: string): TrainingMetric[] {
    return this.state.metrics[runId] || [];
  }

  getLatestMetric(runId: string): TrainingMetric | null {
    const list = this.getMetrics(runId);
    return list.length ? list[list.length - 1] : null;
  }

  listRuns(): TrainingRunMeta[] {
    return Object.values(this.state.runs).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  addLog(runId: string, line: string) {
    if (!this.state.logs[runId]) this.state.logs[runId] = [];
    this.state.logs[runId].push(line);
    if (this.state.logs[runId].length > 2000) this.state.logs[runId].shift();
    this.persist();
  }

  getLogs(runId: string, limit = 200): string[] {
    const lines = this.state.logs[runId] || [];
    return lines.slice(-limit);
  }

  addCheckpoint(runId: string, filePath: string) {
    if (!this.state.checkpoints[runId]) this.state.checkpoints[runId] = [];
    this.state.checkpoints[runId].push(filePath);
    this.updateRun(runId, { lastCheckpointPath: filePath });
    this.persist();
  }

  getCheckpoints(runId: string): string[] {
    return this.state.checkpoints[runId] || [];
  }

  // Additional methods needed by trainer
  getCurrentRun(): TrainingRunMeta | null {
    const runs = this.listRuns();
    const activeRun = runs.find(run => run.phase === 'running' || run.phase === 'paused');
    return activeRun || null;
  }

  errorRun(errorMessage: string): void {
    const currentRun = this.getCurrentRun();
    if (currentRun) {
      this.updateRun(currentRun.runId, { phase: 'error' });
      this.addLog(currentRun.runId, `ERROR: ${errorMessage}`);
    }
  }

  async pauseRun(): Promise<void> {
    const currentRun = this.getCurrentRun();
    if (currentRun) {
      this.updateRun(currentRun.runId, { phase: 'paused' });
    }
  }

  async resumeRun(): Promise<void> {
    const currentRun = this.getCurrentRun();
    if (currentRun) {
      this.updateRun(currentRun.runId, { phase: 'running' });
    }
  }

  async stopRun(): Promise<void> {
    const currentRun = this.getCurrentRun();
    if (currentRun) {
      this.updateRun(currentRun.runId, { phase: 'stopped' });
    }
  }

  async completeRun(): Promise<void> {
    const currentRun = this.getCurrentRun();
    if (currentRun) {
      this.updateRun(currentRun.runId, { phase: 'completed' });
    }
  }

  async createCheckpoint(runId: string, checkpointId: string, _tag: string): Promise<void> {
    const checkpointPath = `checkpoints/${runId}/${checkpointId}`;
    this.addCheckpoint(runId, checkpointPath);
  }

  async updateBestCheckpoint(checkpointId: string): Promise<void> {
    const currentRun = this.getCurrentRun();
    if (currentRun) {
      this.updateRun(currentRun.runId, { lastCheckpointPath: checkpointId });
    }
  }

  async updateProgress(epoch: number, _step: number): Promise<void> {
    const currentRun = this.getCurrentRun();
    if (currentRun) {
      this.updateRun(currentRun.runId, { currentEpoch: epoch });
    }
  }
}

export default TrainingStateManager;
