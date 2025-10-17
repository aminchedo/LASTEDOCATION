/**
 * Storage management for training models, checkpoints, and logs
 * Handles file system operations for the single-model training system
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../middleware/logger';

export interface CheckpointInfo {
  id: string;
  runId: string;
  createdAt: string;
  path: string;
  tag: 'latest' | 'best' | 'manual';
  metric?: number;
  resumeToken?: string;
}

export interface ModelConfig {
  vocabSize: number;
  hiddenSize: number;
  numLayers: number;
  learningRate: number;
  batchSize: number;
  epochs: number;
  saveEverySteps: number;
}

export class TrainingStorage {
  private readonly modelsDir: string;
  private readonly logsDir: string;
  private readonly checkpointsDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.modelsDir = path.join(baseDir, 'models', 'main_model');
    this.logsDir = path.join(baseDir, 'logs', 'training');
    this.checkpointsDir = path.join(this.modelsDir, 'checkpoints');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.modelsDir, { recursive: true });
      await fs.mkdir(this.logsDir, { recursive: true });
      await fs.mkdir(this.checkpointsDir, { recursive: true });
      
      // Create default config if it doesn't exist
      const configPath = path.join(this.modelsDir, 'config.json');
      try {
        await fs.access(configPath);
      } catch {
        const defaultConfig: ModelConfig = {
          vocabSize: 1000,
          hiddenSize: 64,
          numLayers: 2,
          learningRate: 0.001,
          batchSize: 32,
          epochs: 10,
          saveEverySteps: 100
        };
        await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
        logger.info(`Created default model config: path=${configPath}`);
      }
    } catch (error: any) {
      logger.error(`Failed to initialize training storage: ${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async getModelConfig(): Promise<ModelConfig> {
    try {
      const configPath = path.join(this.modelsDir, 'config.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error: any) {
      logger.error(`Failed to read model config: ${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async updateModelConfig(config: Partial<ModelConfig>): Promise<void> {
    try {
      const currentConfig = await this.getModelConfig();
      const updatedConfig = { ...currentConfig, ...config };
      const configPath = path.join(this.modelsDir, 'config.json');
      await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
      logger.info(`Updated model config: config=${JSON.stringify(updatedConfig)}`);
    } catch (error: any) {
      logger.error(`Failed to update model config: ${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async saveCheckpoint(
    runId: string,
    checkpointId: string,
    weights: any,
    resumeToken: any,
    tag: 'latest' | 'best' | 'manual',
    metric?: number
  ): Promise<string> {
    try {
      const checkpointPath = path.join(this.checkpointsDir, `${checkpointId}.json`);
      const checkpointData = {
        id: checkpointId,
        runId,
        createdAt: new Date().toISOString(),
        weights,
        resumeToken,
        tag,
        metric
      };
      
      await fs.writeFile(checkpointPath, JSON.stringify(checkpointData, null, 2));
      
      // Update latest checkpoint symlink
      if (tag === 'latest') {
        const latestPath = path.join(this.checkpointsDir, 'latest.json');
        try {
          await fs.unlink(latestPath);
        } catch {
          // Ignore if doesn't exist
        }
        await fs.symlink(checkpointPath, latestPath);
      }
      
      logger.info(`Saved checkpoint: checkpointId=${checkpointId} runId=${runId} tag=${tag} metric=${metric} path=${checkpointPath}`);
      
      return checkpointPath;
    } catch (error: any) {
      logger.error(`Failed to save checkpoint: ${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async loadCheckpoint(checkpointId: string): Promise<any> {
    try {
      const checkpointPath = path.join(this.checkpointsDir, `${checkpointId}.json`);
      const checkpointData = await fs.readFile(checkpointPath, 'utf-8');
      return JSON.parse(checkpointData);
    } catch (error: any) {
      logger.error(`Failed to load checkpoint: checkpointId=${checkpointId} error=${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async listCheckpoints(runId?: string): Promise<CheckpointInfo[]> {
    try {
      const files = await fs.readdir(this.checkpointsDir);
      const checkpoints: CheckpointInfo[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json') && file !== 'latest.json') {
          try {
            const filePath = path.join(this.checkpointsDir, file);
            const data = await fs.readFile(filePath, 'utf-8');
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
          } catch (error) {
            logger.warn(`Failed to parse checkpoint file: file=${file} error=${String(error)}`);
          }
        }
      }
      
      return checkpoints.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error: any) {
      logger.error(`Failed to list checkpoints: ${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async deleteCheckpoint(checkpointId: string): Promise<void> {
    try {
      const checkpointPath = path.join(this.checkpointsDir, `${checkpointId}.json`);
      await fs.unlink(checkpointPath);
      logger.info(`Deleted checkpoint: checkpointId=${checkpointId}`);
    } catch (error: any) {
      logger.error(`Failed to delete checkpoint: checkpointId=${checkpointId} error=${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async appendMetrics(metrics: any): Promise<void> {
    try {
      const metricsPath = path.join(this.logsDir, 'metrics.jsonl');
      const line = JSON.stringify(metrics) + '\n';
      await fs.appendFile(metricsPath, line);
    } catch (error: any) {
      logger.error(`Failed to append metrics: ${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async readMetrics(sinceId?: string): Promise<any[]> {
    try {
      const metricsPath = path.join(this.logsDir, 'metrics.jsonl');
      
      try {
        await fs.access(metricsPath);
      } catch {
        return []; // File doesn't exist yet
      }
      
      const content = await fs.readFile(metricsPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      let metrics = lines.map(line => JSON.parse(line));
      
      if (sinceId) {
        const sinceIndex = metrics.findIndex(m => m.id === sinceId);
        if (sinceIndex !== -1) {
          metrics = metrics.slice(sinceIndex + 1);
        }
      }
      
      return metrics;
    } catch (error: any) {
      logger.error(`Failed to read metrics: ${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async appendLog(level: 'info' | 'warn' | 'error', message: string, data?: any): Promise<void> {
    try {
      const logPath = path.join(this.logsDir, 'training.log');
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        ...data
      };
      const line = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logPath, line);
    } catch (error: any) {
      logger.error(`Failed to append log: ${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async getLogs(limit: number = 100): Promise<any[]> {
    try {
      const logPath = path.join(this.logsDir, 'training.log');
      
      try {
        await fs.access(logPath);
      } catch {
        return []; // File doesn't exist yet
      }
      
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      const logs = lines
        .slice(-limit) // Get last N lines
        .map(line => JSON.parse(line));
      
      return logs;
    } catch (error: any) {
      logger.error(`Failed to read logs: ${String((error as any)?.message || error)}`);
      throw error;
    }
  }

  async getStorageInfo(): Promise<{ modelsDir: string; logsDir: string; checkpointsDir: string }> {
    return {
      modelsDir: this.modelsDir,
      logsDir: this.logsDir,
      checkpointsDir: this.checkpointsDir
    };
  }
}
