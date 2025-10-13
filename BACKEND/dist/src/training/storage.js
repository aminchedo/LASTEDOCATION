"use strict";
/**
 * Storage management for training models, checkpoints, and logs
 * Handles file system operations for the single-model training system
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingStorage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../middleware/logger");
class TrainingStorage {
    constructor(baseDir = process.cwd()) {
        this.modelsDir = path_1.default.join(baseDir, 'models', 'main_model');
        this.logsDir = path_1.default.join(baseDir, 'logs', 'training');
        this.checkpointsDir = path_1.default.join(this.modelsDir, 'checkpoints');
    }
    async initialize() {
        try {
            await promises_1.default.mkdir(this.modelsDir, { recursive: true });
            await promises_1.default.mkdir(this.logsDir, { recursive: true });
            await promises_1.default.mkdir(this.checkpointsDir, { recursive: true });
            // Create default config if it doesn't exist
            const configPath = path_1.default.join(this.modelsDir, 'config.json');
            try {
                await promises_1.default.access(configPath);
            }
            catch {
                const defaultConfig = {
                    vocabSize: 1000,
                    hiddenSize: 64,
                    numLayers: 2,
                    learningRate: 0.001,
                    batchSize: 32,
                    epochs: 10,
                    saveEverySteps: 100
                };
                await promises_1.default.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
                logger_1.logger.info(`Created default model config: path=${configPath}`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to initialize training storage: ${String(error?.message || error)}`);
            throw error;
        }
    }
    async getModelConfig() {
        try {
            const configPath = path_1.default.join(this.modelsDir, 'config.json');
            const configData = await promises_1.default.readFile(configPath, 'utf-8');
            return JSON.parse(configData);
        }
        catch (error) {
            logger_1.logger.error(`Failed to read model config: ${String(error?.message || error)}`);
            throw error;
        }
    }
    async updateModelConfig(config) {
        try {
            const currentConfig = await this.getModelConfig();
            const updatedConfig = { ...currentConfig, ...config };
            const configPath = path_1.default.join(this.modelsDir, 'config.json');
            await promises_1.default.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
            logger_1.logger.info(`Updated model config: config=${JSON.stringify(updatedConfig)}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to update model config: ${String(error?.message || error)}`);
            throw error;
        }
    }
    async saveCheckpoint(runId, checkpointId, weights, resumeToken, tag, metric) {
        try {
            const checkpointPath = path_1.default.join(this.checkpointsDir, `${checkpointId}.json`);
            const checkpointData = {
                id: checkpointId,
                runId,
                createdAt: new Date().toISOString(),
                weights,
                resumeToken,
                tag,
                metric
            };
            await promises_1.default.writeFile(checkpointPath, JSON.stringify(checkpointData, null, 2));
            // Update latest checkpoint symlink
            if (tag === 'latest') {
                const latestPath = path_1.default.join(this.checkpointsDir, 'latest.json');
                try {
                    await promises_1.default.unlink(latestPath);
                }
                catch {
                    // Ignore if doesn't exist
                }
                await promises_1.default.symlink(checkpointPath, latestPath);
            }
            logger_1.logger.info(`Saved checkpoint: checkpointId=${checkpointId} runId=${runId} tag=${tag} metric=${metric} path=${checkpointPath}`);
            return checkpointPath;
        }
        catch (error) {
            logger_1.logger.error(`Failed to save checkpoint: ${String(error?.message || error)}`);
            throw error;
        }
    }
    async loadCheckpoint(checkpointId) {
        try {
            const checkpointPath = path_1.default.join(this.checkpointsDir, `${checkpointId}.json`);
            const checkpointData = await promises_1.default.readFile(checkpointPath, 'utf-8');
            return JSON.parse(checkpointData);
        }
        catch (error) {
            logger_1.logger.error(`Failed to load checkpoint: checkpointId=${checkpointId} error=${String(error?.message || error)}`);
            throw error;
        }
    }
    async listCheckpoints(runId) {
        try {
            const files = await promises_1.default.readdir(this.checkpointsDir);
            const checkpoints = [];
            for (const file of files) {
                if (file.endsWith('.json') && file !== 'latest.json') {
                    try {
                        const filePath = path_1.default.join(this.checkpointsDir, file);
                        const data = await promises_1.default.readFile(filePath, 'utf-8');
                        const checkpoint = JSON.parse(data);
                        if (!runId || checkpoint.runId === runId) {
                            checkpoints.push({
                                id: checkpoint.id,
                                runId: checkpoint.runId,
                                createdAt: checkpoint.createdAt,
                                path: filePath,
                                tag: checkpoint.tag,
                                metric: checkpoint.metric,
                                resumeToken: checkpoint.resumeToken
                            });
                        }
                    }
                    catch (error) {
                        logger_1.logger.warn(`Failed to parse checkpoint file: file=${file} error=${String(error)}`);
                    }
                }
            }
            return checkpoints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        catch (error) {
            logger_1.logger.error(`Failed to list checkpoints: ${String(error?.message || error)}`);
            throw error;
        }
    }
    async deleteCheckpoint(checkpointId) {
        try {
            const checkpointPath = path_1.default.join(this.checkpointsDir, `${checkpointId}.json`);
            await promises_1.default.unlink(checkpointPath);
            logger_1.logger.info(`Deleted checkpoint: checkpointId=${checkpointId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete checkpoint: checkpointId=${checkpointId} error=${String(error?.message || error)}`);
            throw error;
        }
    }
    async appendMetrics(metrics) {
        try {
            const metricsPath = path_1.default.join(this.logsDir, 'metrics.jsonl');
            const line = JSON.stringify(metrics) + '\n';
            await promises_1.default.appendFile(metricsPath, line);
        }
        catch (error) {
            logger_1.logger.error(`Failed to append metrics: ${String(error?.message || error)}`);
            throw error;
        }
    }
    async readMetrics(sinceId) {
        try {
            const metricsPath = path_1.default.join(this.logsDir, 'metrics.jsonl');
            try {
                await promises_1.default.access(metricsPath);
            }
            catch {
                return []; // File doesn't exist yet
            }
            const content = await promises_1.default.readFile(metricsPath, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            let metrics = lines.map(line => JSON.parse(line));
            if (sinceId) {
                const sinceIndex = metrics.findIndex(m => m.id === sinceId);
                if (sinceIndex !== -1) {
                    metrics = metrics.slice(sinceIndex + 1);
                }
            }
            return metrics;
        }
        catch (error) {
            logger_1.logger.error(`Failed to read metrics: ${String(error?.message || error)}`);
            throw error;
        }
    }
    async appendLog(level, message, data) {
        try {
            const logPath = path_1.default.join(this.logsDir, 'training.log');
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                ...data
            };
            const line = JSON.stringify(logEntry) + '\n';
            await promises_1.default.appendFile(logPath, line);
        }
        catch (error) {
            logger_1.logger.error(`Failed to append log: ${String(error?.message || error)}`);
            throw error;
        }
    }
    async getLogs(limit = 100) {
        try {
            const logPath = path_1.default.join(this.logsDir, 'training.log');
            try {
                await promises_1.default.access(logPath);
            }
            catch {
                return []; // File doesn't exist yet
            }
            const content = await promises_1.default.readFile(logPath, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            const logs = lines
                .slice(-limit) // Get last N lines
                .map(line => JSON.parse(line));
            return logs;
        }
        catch (error) {
            logger_1.logger.error(`Failed to read logs: ${String(error?.message || error)}`);
            throw error;
        }
    }
    async getStorageInfo() {
        return {
            modelsDir: this.modelsDir,
            logsDir: this.logsDir,
            checkpointsDir: this.checkpointsDir
        };
    }
}
exports.TrainingStorage = TrainingStorage;
//# sourceMappingURL=storage.js.map