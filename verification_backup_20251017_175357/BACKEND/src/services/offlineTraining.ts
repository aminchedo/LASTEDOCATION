/**
 * Offline Training Service
 * Handles offline model training with dataset management
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { logger } from '../middleware/logger';
import { datasetManager, DatasetMetadata } from './datasetManager';
import { modelManager, ModelMetadata } from './modelManager';

export interface TrainingJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  datasetId: string;
  baseModelId?: string;
  config: TrainingConfig;
  progress: {
    epoch: number;
    step: number;
    totalEpochs: number;
    totalSteps: number;
    percentage: number;
  };
  metrics: {
    loss: number;
    accuracy: number;
    perplexity?: number;
    bleu?: number;
    rouge?: number;
  };
  logs: string[];
  startedAt: string;
  completedAt?: string;
  error?: string;
  outputPath?: string;
}

export interface TrainingConfig {
  // Model Configuration
  modelType: 'llm' | 'stt' | 'tts' | 'embedding' | 'classification';
  architecture: string;
  hiddenSize: number;
  numLayers: number;
  numHeads: number;
  vocabSize: number;

  // Training Configuration
  epochs: number;
  batchSize: number;
  learningRate: number;
  weightDecay: number;
  warmupSteps: number;
  maxSteps?: number;
  gradientAccumulationSteps: number;
  maxGradNorm: number;

  // Data Configuration
  trainSplit: number;
  valSplit: number;
  testSplit: number;
  maxSequenceLength: number;
  dataAugmentation: boolean;

  // Optimization
  optimizer: 'adam' | 'adamw' | 'sgd' | 'rmsprop';
  scheduler: 'linear' | 'cosine' | 'constant' | 'polynomial';
  mixedPrecision: boolean;
  gradientCheckpointing: boolean;

  // Hardware
  useGPU: boolean;
  numGPUs: number;
  cpuOnly: boolean;

  // Output
  outputDir: string;
  saveSteps: number;
  evalSteps: number;
  loggingSteps: number;
  saveTotalLimit: number;
}

export interface TrainingMetrics {
  epoch: number;
  step: number;
  loss: number;
  accuracy: number;
  perplexity?: number;
  bleu?: number;
  rouge?: number;
  learningRate: number;
  gradientNorm: number;
  timestamp: string;
}

class OfflineTrainingService {
  private jobs: Map<string, TrainingJob>;
  private jobsPath: string;
  private trainingPath: string;

  constructor() {
    this.jobs = new Map();
    this.jobsPath = path.join(process.cwd(), 'models', 'training');
    this.trainingPath = path.join(process.cwd(), 'data', 'training');
    this.initialize();
  }

  private initialize(): void {
    try {
      // Ensure directories exist
      if (!fs.existsSync(this.jobsPath)) {
        fs.mkdirSync(this.jobsPath, { recursive: true });
      }
      if (!fs.existsSync(this.trainingPath)) {
        fs.mkdirSync(this.trainingPath, { recursive: true });
      }

      // Load existing jobs
      this.loadJobs();

      logger.info({ 
        msg: 'offline_training_initialized', 
        jobsCount: this.jobs.size,
        jobsPath: this.jobsPath 
      });
    } catch (error: any) {
      logger.error({ msg: 'offline_training_init_failed', error: error.message });
      throw error;
    }
  }

  private loadJobs(): void {
    try {
      const jobsFile = path.join(this.jobsPath, 'jobs.json');
      if (fs.existsSync(jobsFile)) {
        const rawData = fs.readFileSync(jobsFile, 'utf-8');
        const jobs = JSON.parse(rawData);
        jobs.forEach((job: TrainingJob) => {
          this.jobs.set(job.id, job);
        });
      }
    } catch (error: any) {
      logger.error({ msg: 'jobs_load_failed', error: error.message });
    }
  }

  private saveJobs(): void {
    try {
      const jobsFile = path.join(this.jobsPath, 'jobs.json');
      const jobs = Array.from(this.jobs.values());
      fs.writeFileSync(jobsFile, JSON.stringify(jobs, null, 2), 'utf-8');
    } catch (error: any) {
      logger.error({ msg: 'jobs_save_failed', error: error.message });
    }
  }

  private generateTrainingScript(job: TrainingJob): string {
    const dataset = datasetManager.getDataset(job.datasetId);
    const baseModel = job.baseModelId ? modelManager.getModel(job.baseModelId) : null;

    if (!dataset) {
      throw new Error(`Dataset not found: ${job.datasetId}`);
    }

    const script = `
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import json
import os
import time
from datetime import datetime

# Training Configuration
CONFIG = ${JSON.stringify(job.config, null, 2)}

class PersianDataset(Dataset):
    def __init__(self, data_path, max_length=${job.config.maxSequenceLength}):
        self.data = []
        self.max_length = max_length
        
        # Load dataset
        with open('${dataset.filePath}', 'r', encoding='utf-8') as f:
            if '${dataset.format}' == 'jsonl':
                for line in f:
                    if line.strip():
                        self.data.append(json.loads(line))
            elif '${dataset.format}' == 'json':
                self.data = json.load(f)
        
        print(f"Loaded {len(self.data)} samples")
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        sample = self.data[idx]
        # Implement your data processing here
        return {
            'input_ids': torch.tensor([1, 2, 3]),  # Placeholder
            'labels': torch.tensor([1, 2, 3])      # Placeholder
        }

class PersianModel(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.config = config
        self.embedding = nn.Embedding(config['vocabSize'], config['hiddenSize'])
        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(
                d_model=config['hiddenSize'],
                nhead=config['numHeads'],
                dim_feedforward=config['hiddenSize'] * 4,
                dropout=0.1
            ),
            num_layers=config['numLayers']
        )
        self.lm_head = nn.Linear(config['hiddenSize'], config['vocabSize'])
    
    def forward(self, input_ids, labels=None):
        x = self.embedding(input_ids)
        x = self.transformer(x)
        logits = self.lm_head(x)
        
        loss = None
        if labels is not None:
            loss_fct = nn.CrossEntropyLoss()
            loss = loss_fct(logits.view(-1, logits.size(-1)), labels.view(-1))
        
        return {'loss': loss, 'logits': logits}

def train_model():
    print("🚀 Starting Persian Model Training")
    print(f"📊 Dataset: ${dataset.name}")
    print(f"🎯 Model Type: ${job.config.modelType}")
    print(f"📈 Epochs: ${job.config.epochs}")
    print(f"📦 Batch Size: ${job.config.batchSize}")
    print(f"🎓 Learning Rate: ${job.config.learningRate}")
    
    # Initialize model
    model = PersianModel(CONFIG)
    
    # Initialize dataset
    dataset = PersianDataset('${dataset.filePath}')
    dataloader = DataLoader(dataset, batch_size=CONFIG['batchSize'], shuffle=True)
    
    # Initialize optimizer
    optimizer = optim.AdamW(model.parameters(), lr=CONFIG['learningRate'], weight_decay=CONFIG['weightDecay'])
    
    # Training loop
    model.train()
    total_steps = len(dataloader) * CONFIG['epochs']
    current_step = 0
    
    for epoch in range(CONFIG['epochs']):
        epoch_loss = 0
        epoch_steps = 0
        
        for batch_idx, batch in enumerate(dataloader):
            optimizer.zero_grad()
            
            outputs = model(batch['input_ids'], batch['labels'])
            loss = outputs['loss']
            
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            epoch_steps += 1
            current_step += 1
            
            # Log progress
            if current_step % CONFIG['loggingSteps'] == 0:
                progress = (current_step / total_steps) * 100
                print(f"Epoch {epoch+1}/{CONFIG['epochs']}, Step {current_step}/{total_steps} ({progress:.1f}%), Loss: {loss.item():.4f}")
            
            # Save checkpoint
            if current_step % CONFIG['saveSteps'] == 0:
                checkpoint_path = os.path.join('${job.config.outputDir}', f'checkpoint-{current_step}')
                os.makedirs(checkpoint_path, exist_ok=True)
                torch.save({
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'epoch': epoch,
                    'step': current_step,
                    'loss': loss.item()
                }, os.path.join(checkpoint_path, 'pytorch_model.bin'))
                print(f"💾 Checkpoint saved: {checkpoint_path}")
        
        avg_loss = epoch_loss / epoch_steps
        print(f"📊 Epoch {epoch+1} completed. Average Loss: {avg_loss:.4f}")
    
    # Save final model
    final_model_path = os.path.join('${job.config.outputDir}', 'final_model')
    os.makedirs(final_model_path, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(final_model_path, 'pytorch_model.bin'))
    
    print("✅ Training completed successfully!")
    print(f"📁 Model saved to: {final_model_path}")

if __name__ == "__main__":
    train_model()
`;

    return script;
  }

  // Training Job Management
  async createTrainingJob(
    name: string,
    datasetId: string,
    config: TrainingConfig,
    baseModelId?: string
  ): Promise<TrainingJob> {
    try {
      // Validate dataset exists
      const dataset = datasetManager.getDataset(datasetId);
      if (!dataset) {
        throw new Error(`Dataset not found: ${datasetId}`);
      }

      // Validate base model if provided
      if (baseModelId) {
        const baseModel = modelManager.getModel(baseModelId);
        if (!baseModel) {
          throw new Error(`Base model not found: ${baseModelId}`);
        }
      }

      // Generate unique ID
      const id = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create output directory
      const outputDir = path.join(this.trainingPath, id);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const job: TrainingJob = {
        id,
        name,
        status: 'pending',
        datasetId,
        baseModelId,
        config: {
          ...config,
          outputDir
        },
        progress: {
          epoch: 0,
          step: 0,
          totalEpochs: config.epochs,
          totalSteps: 0,
          percentage: 0
        },
        metrics: {
          loss: 0,
          accuracy: 0
        },
        logs: [],
        startedAt: new Date().toISOString()
      };

      this.jobs.set(id, job);
      this.saveJobs();

      logger.info({ msg: 'training_job_created', id, name, datasetId });
      return job;
    } catch (error: any) {
      logger.error({ msg: 'training_job_creation_failed', error: error.message });
      throw error;
    }
  }

  async startTraining(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    try {
      job.status = 'running';
      this.saveJobs();

      // Generate training script
      const script = this.generateTrainingScript(job);
      const scriptPath = path.join(job.config.outputDir, 'train.py');
      fs.writeFileSync(scriptPath, script);

      // Start training process
      this.runTrainingProcess(jobId, scriptPath);

      logger.info({ msg: 'training_started', jobId });
      return true;
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      this.saveJobs();

      logger.error({ msg: 'training_start_failed', jobId, error: error.message });
      return false;
    }
  }

  private async runTrainingProcess(jobId: string, scriptPath: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      const proc = spawn('python', [scriptPath], {
        cwd: job.config.outputDir,
        env: { ...process.env, NODE_ENV: 'development' }
      });

      // Capture stdout
      proc.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            job.logs.push(line.trim());
            this.saveJobs();

            // Parse progress from logs
            this.parseProgressFromLog(job, line);
          }
        }
      });

      // Capture stderr
      proc.stderr.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            job.logs.push(`ERROR: ${line.trim()}`);
            this.saveJobs();
          }
        }
      });

      // Handle process completion
      proc.on('close', (code: number) => {
        if (code === 0) {
          job.status = 'completed';
          job.completedAt = new Date().toISOString();
          job.outputPath = job.config.outputDir;
        } else {
          job.status = 'failed';
          job.error = `Training process exited with code ${code}`;
        }
        this.saveJobs();

        logger.info({ msg: 'training_process_completed', jobId, code });
      });

      // Handle process errors
      proc.on('error', (error: any) => {
        job.status = 'failed';
        job.error = error.message;
        this.saveJobs();

        logger.error({ msg: 'training_process_error', jobId, error: error.message });
      });

    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      this.saveJobs();

      logger.error({ msg: 'training_process_failed', jobId, error: error.message });
    }
  }

  private parseProgressFromLog(job: TrainingJob, logLine: string): void {
    // Parse epoch progress
    const epochMatch = logLine.match(/Epoch (\d+)\/(\d+)/);
    if (epochMatch) {
      job.progress.epoch = parseInt(epochMatch[1]);
      job.progress.totalEpochs = parseInt(epochMatch[2]);
    }

    // Parse step progress
    const stepMatch = logLine.match(/Step (\d+)\/(\d+)/);
    if (stepMatch) {
      job.progress.step = parseInt(stepMatch[1]);
      job.progress.totalSteps = parseInt(stepMatch[2]);
    }

    // Parse loss
    const lossMatch = logLine.match(/Loss: ([\d.]+)/);
    if (lossMatch) {
      job.metrics.loss = parseFloat(lossMatch[1]);
    }

    // Parse accuracy
    const accuracyMatch = logLine.match(/Accuracy: ([\d.]+)/);
    if (accuracyMatch) {
      job.metrics.accuracy = parseFloat(accuracyMatch[1]);
    }

    // Calculate percentage
    if (job.progress.totalSteps > 0) {
      job.progress.percentage = Math.round((job.progress.step / job.progress.totalSteps) * 100);
    }
  }

  getTrainingJob(jobId: string): TrainingJob | null {
    return this.jobs.get(jobId) || null;
  }

  getAllTrainingJobs(): TrainingJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  pauseTraining(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'running') return false;

    job.status = 'paused';
    this.saveJobs();

    logger.info({ msg: 'training_paused', jobId });
    return true;
  }

  resumeTraining(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'paused') return false;

    job.status = 'running';
    this.saveJobs();

    logger.info({ msg: 'training_resumed', jobId });
    return true;
  }

  cancelTraining(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || ['completed', 'failed', 'cancelled'].includes(job.status)) return false;

    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();
    this.saveJobs();

    logger.info({ msg: 'training_cancelled', jobId });
    return true;
  }

  deleteTrainingJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    try {
      // Delete output directory
      if (fs.existsSync(job.config.outputDir)) {
        fs.rmSync(job.config.outputDir, { recursive: true, force: true });
      }

      // Remove from jobs
      this.jobs.delete(jobId);
      this.saveJobs();

      logger.info({ msg: 'training_job_deleted', jobId });
      return true;
    } catch (error: any) {
      logger.error({ msg: 'training_job_delete_failed', jobId, error: error.message });
      return false;
    }
  }

  // Statistics
  getStats(): {
    totalJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalTrainingTime: number;
  } {
    const jobs = Array.from(this.jobs.values());
    const runningJobs = jobs.filter(j => j.status === 'running').length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const failedJobs = jobs.filter(j => j.status === 'failed').length;

    const totalTrainingTime = jobs.reduce((total, job) => {
      if (job.completedAt) {
        const start = new Date(job.startedAt).getTime();
        const end = new Date(job.completedAt).getTime();
        return total + (end - start);
      }
      return total;
    }, 0);

    return {
      totalJobs: jobs.length,
      runningJobs,
      completedJobs,
      failedJobs,
      totalTrainingTime
    };
  }
}

// Export singleton instance
export const offlineTrainingService = new OfflineTrainingService();
export default offlineTrainingService;
