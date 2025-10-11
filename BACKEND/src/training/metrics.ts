
import { logger } from '../utils/logger';
import TrainingStateManager, { TrainingMetric } from './state';

export class MetricsService {
  constructor(private state: TrainingStateManager) { }

  record(runId: string, data: Omit<TrainingMetric, 'ts' | 'runId'> & { ts?: number }) {
    try {
      const metric: TrainingMetric = {
        runId,
        ts: data.ts ?? Date.now(),
        epoch: data.epoch,
        step: data.step,
        loss: data.loss,
        valLoss: data.valLoss,
        accuracy: data.accuracy,
      };
      this.state.appendMetric(metric);
      logger.debug(`Recorded training metric: run=${runId} epoch=${metric.epoch} step=${metric.step} loss=${metric.loss}`);
      return metric;
    } catch (e) {
      logger.error(`Failed to record metric: ${String((e as any)?.message || e)}`);
      throw e;
    }
  }

  list(runId?: string) {
    try {
      if (!runId) {
        const all: Record<string, TrainingMetric[]> = {};
        for (const meta of this.state.listRuns()) {
          all[meta.runId] = this.state.getMetrics(meta.runId);
        }
        return all;
      }
      return this.state.getMetrics(runId);
    } catch (e) {
      logger.error(`Failed to get metrics: ${String((e as any)?.message || e)}`);
      throw e;
    }
  }

  latest(runId: string) {
    try {
      return this.state.getLatestMetric(runId);
    } catch (e) {
      logger.error(`Failed to get latest metrics: ${String((e as any)?.message || e)}`);
      throw e;
    }
  }

  summary(runId: string) {
    try {
      const ms = this.state.getMetrics(runId);
      if (ms.length === 0) return null;
      const losses = ms.map(m => m.loss);
      const accs = ms.map(m => m.accuracy ?? 0).filter(n => !Number.isNaN(n));
      const minLoss = Math.min(...losses);
      const maxLoss = Math.max(...losses);
      const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
      const avgAcc = accs.length ? accs.reduce((a, b) => (a as number) + (b as number), 0) / accs.length : undefined;
      return { runId, count: ms.length, minLoss, maxLoss, avgLoss, avgAcc };
    } catch (e) {
      logger.error(`Failed to get metrics summary: ${String((e as any)?.message || e)}`);
      throw e;
    }
  }

  eta(runId: string, targetEpochs: number) {
    try {
      const ms = this.state.getMetrics(runId);
      if (ms.length < 2) return null;
      const first = ms[0].ts;
      const last = ms[ms.length - 1].ts;
      const epochsCovered = ms[ms.length - 1].epoch - ms[0].epoch + 1;
      if (epochsCovered <= 0) return null;
      const msPerEpoch = (last - first) / epochsCovered;
      const latestEpoch = ms[ms.length - 1].epoch;
      const remainingEpochs = Math.max(0, targetEpochs - latestEpoch);
      const etaMs = remainingEpochs * msPerEpoch;
      const etaAt = Date.now() + etaMs;
      return { msPerEpoch, remainingEpochs, etaAt };
    } catch (e) {
      logger.error(`Failed to calculate ETA: ${String((e as any)?.message || e)}`);
      throw e;
    }
  }

  // Additional methods needed by trainer
  async getLatestMetrics(runId: string): Promise<TrainingMetric[]> {
    try {
      const metrics = this.state.getMetrics(runId);
      return metrics.slice(-10); // Return last 10 metrics
    } catch (e) {
      logger.error(`Failed to get latest metrics: ${String((e as any)?.message || e)}`);
      return [];
    }
  }

  async recordMetric(runId: string, epoch: number, step: number, loss: number, valLoss?: number, accuracy?: number): Promise<void> {
    try {
      const metric: TrainingMetric = {
        runId,
        ts: Date.now(),
        epoch,
        step,
        loss,
        valLoss,
        accuracy
      };
      this.state.appendMetric(metric);
    } catch (e) {
      logger.error(`Failed to record metric: ${String((e as any)?.message || e)}`);
      throw e;
    }
  }
}

export default MetricsService;
