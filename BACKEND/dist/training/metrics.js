"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const logger_1 = require("../utils/logger");
class MetricsService {
    constructor(state) {
        this.state = state;
    }
    record(runId, data) {
        try {
            const metric = {
                runId,
                ts: data.ts ?? Date.now(),
                epoch: data.epoch,
                step: data.step,
                loss: data.loss,
                valLoss: data.valLoss,
                accuracy: data.accuracy,
            };
            this.state.appendMetric(metric);
            logger_1.logger.debug(`Recorded training metric: run=${runId} epoch=${metric.epoch} step=${metric.step} loss=${metric.loss}`);
            return metric;
        }
        catch (e) {
            logger_1.logger.error(`Failed to record metric: ${String(e?.message || e)}`);
            throw e;
        }
    }
    list(runId) {
        try {
            if (!runId) {
                const all = {};
                for (const meta of this.state.listRuns()) {
                    all[meta.runId] = this.state.getMetrics(meta.runId);
                }
                return all;
            }
            return this.state.getMetrics(runId);
        }
        catch (e) {
            logger_1.logger.error(`Failed to get metrics: ${String(e?.message || e)}`);
            throw e;
        }
    }
    latest(runId) {
        try {
            return this.state.getLatestMetric(runId);
        }
        catch (e) {
            logger_1.logger.error(`Failed to get latest metrics: ${String(e?.message || e)}`);
            throw e;
        }
    }
    summary(runId) {
        try {
            const ms = this.state.getMetrics(runId);
            if (ms.length === 0)
                return null;
            const losses = ms.map(m => m.loss);
            const accs = ms.map(m => m.accuracy ?? 0).filter(n => !Number.isNaN(n));
            const minLoss = Math.min(...losses);
            const maxLoss = Math.max(...losses);
            const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
            const avgAcc = accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : undefined;
            return { runId, count: ms.length, minLoss, maxLoss, avgLoss, avgAcc };
        }
        catch (e) {
            logger_1.logger.error(`Failed to get metrics summary: ${String(e?.message || e)}`);
            throw e;
        }
    }
    eta(runId, targetEpochs) {
        try {
            const ms = this.state.getMetrics(runId);
            if (ms.length < 2)
                return null;
            const first = ms[0].ts;
            const last = ms[ms.length - 1].ts;
            const epochsCovered = ms[ms.length - 1].epoch - ms[0].epoch + 1;
            if (epochsCovered <= 0)
                return null;
            const msPerEpoch = (last - first) / epochsCovered;
            const latestEpoch = ms[ms.length - 1].epoch;
            const remainingEpochs = Math.max(0, targetEpochs - latestEpoch);
            const etaMs = remainingEpochs * msPerEpoch;
            const etaAt = Date.now() + etaMs;
            return { msPerEpoch, remainingEpochs, etaAt };
        }
        catch (e) {
            logger_1.logger.error(`Failed to calculate ETA: ${String(e?.message || e)}`);
            throw e;
        }
    }
}
exports.MetricsService = MetricsService;
exports.default = MetricsService;
//# sourceMappingURL=metrics.js.map