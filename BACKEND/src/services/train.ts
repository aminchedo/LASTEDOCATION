import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { TrainingJob, TrainingConfig } from '../types/train';
import { logger } from '../middleware/logger';
import { notificationService } from './notifications';

// In-memory job storage
const jobs = new Map<string, TrainingJob>();
const jobProcesses = new Map<string, ChildProcess>();

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateJobId(): string {
  return `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseTrainingLog(line: string, job: TrainingJob) {
  // Parse various training output patterns
  
  // Epoch/Step progress: "Epoch 2/10 [Step 150/500]"
  const epochMatch = line.match(/Epoch\s+(\d+)\/(\d+).*?Step\s+(\d+)\/(\d+)/i);
  if (epochMatch) {
    const currentEpoch = parseInt(epochMatch[1]);
    // const totalEpochs = parseInt(epochMatch[2]); // Unused for now
    const currentStep = parseInt(epochMatch[3]);
    const totalSteps = parseInt(epochMatch[4]);
    
    job.progress = Math.round((currentStep / totalSteps) * 100);
    if (!job.metrics) job.metrics = { step: 0, totalSteps: 0, loss: 0 };
    job.metrics.epoch = currentEpoch;
    job.metrics.step = currentStep;
    job.metrics.totalSteps = totalSteps;
    return;
  }

  // Loss: "loss: 0.234" or "train_loss=0.234"
  const lossMatch = line.match(/(?:loss|train_loss)[:=]\s*([\d.]+)/i);
  if (lossMatch) {
    const loss = parseFloat(lossMatch[1]);
    if (!job.metrics) job.metrics = { step: 0, totalSteps: 0, loss: 0 };
    job.metrics.loss = loss;
    return;
  }

  // Learning rate: "lr: 5e-5" or "learning_rate=0.0001"
  const lrMatch = line.match(/(?:lr|learning_rate)[:=]\s*([\d.e-]+)/i);
  if (lrMatch) {
    const lr = parseFloat(lrMatch[1]);
    if (!job.metrics) job.metrics = { step: 0, totalSteps: 0, loss: 0 };
    job.metrics.learningRate = lr;
    return;
  }

  // Accuracy: "accuracy: 0.89" or "acc=0.89"
  const accMatch = line.match(/(?:accuracy|acc)[:=]\s*([\d.]+)/i);
  if (accMatch) {
    const acc = parseFloat(accMatch[1]);
    if (!job.metrics) job.metrics = { step: 0, totalSteps: 0, loss: 0 };
    job.metrics.accuracy = acc;
    return;
  }

  // Phase detection
  if (line.toLowerCase().includes('preparing')) {
    job.status = 'preparing';
    job.currentPhase = 'Preparing dataset';
  } else if (line.toLowerCase().includes('training')) {
    job.status = 'training';
    job.currentPhase = 'Training model';
  } else if (line.toLowerCase().includes('evaluating') || line.toLowerCase().includes('validation')) {
    job.status = 'evaluating';
    job.currentPhase = 'Evaluating model';
  }
}

export async function startTrainingJob(name: string, config: TrainingConfig): Promise<TrainingJob> {
  const jobId = generateJobId();
  
  const job: TrainingJob = {
    id: jobId,
    name,
    config,
    status: 'pending',
    progress: 0,
    currentPhase: 'Initializing',
    logs: [],
    startedAt: new Date().toISOString(),
  };

  jobs.set(jobId, job);

  // Ensure output directory
  ensureDir(config.outputDir);

  // Log directory
  const logDir = path.join('logs', 'train');
  ensureDir(logDir);
  // const logFile = path.join(logDir, `${jobId}.log`); // Unused - logs stored in memory
  const statusFile = path.join(logDir, `${jobId}.json`);

  // Write initial status
  fs.writeFileSync(statusFile, JSON.stringify(job, null, 2));

  logger.info({ msg: 'Starting training job', jobId, name, config });

  // Create training script path
  const scriptPath = path.join(__dirname, '../../scripts/train_minimal.ts');
  
  // Prepare arguments
  const args = [
    scriptPath,
    '--job-id', jobId,
    '--base-model', config.baseModelPath,
    '--dataset', config.datasetPath,
    '--output', config.outputDir,
    '--epochs', config.epochs.toString(),
    '--lr', config.learningRate.toString(),
    '--batch-size', config.batchSize.toString(),
  ];

  if (config.maxSteps) args.push('--max-steps', config.maxSteps.toString());
  if (config.seed) args.push('--seed', config.seed.toString());
  if (!config.useGpu) args.push('--cpu-only');

  // Spawn training process
  const proc = spawn('ts-node', args, {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'training' }
  });

  jobProcesses.set(jobId, proc);
  job.status = 'preparing';

  // Notify training started
  notificationService.notifyTrainingStarted(name, jobId);

  // Capture stdout
  proc.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        job.logs.push(line.trim());
        parseTrainingLog(line, job);
        logger.debug({ msg: 'Training log', jobId, line: line.trim() });
      }
    }
    // Keep logs trimmed
    if (job.logs.length > 1000) {
      job.logs = job.logs.slice(-500);
    }
    fs.writeFileSync(statusFile, JSON.stringify(job, null, 2));
  });

  // Capture stderr
  proc.stderr.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        job.logs.push(`[ERROR] ${line.trim()}`);
        logger.error({ msg: 'Training error', jobId, line: line.trim() });
      }
    }
  });

  // Handle process completion
  proc.on('close', (code: number) => {
    jobProcesses.delete(jobId);

    if (code === 0) {
      job.status = 'completed';
      job.progress = 100;
      job.currentPhase = 'Completed';
      job.finishedAt = new Date().toISOString();
      logger.info({ msg: 'Training job completed', jobId, name });
      
      // Notify training completed
      notificationService.notifyTrainingCompleted(name, jobId);
    } else {
      job.status = 'error';
      job.error = `Training process exited with code ${code}`;
      job.finishedAt = new Date().toISOString();
      logger.error({ msg: 'Training job failed', jobId, name, code });
      
      // Notify training error
      notificationService.notifyTrainingError(name, `Process exited with code ${code}`);
    }

    fs.writeFileSync(statusFile, JSON.stringify(job, null, 2));
  });

  proc.on('error', (err: Error) => {
    job.status = 'error';
    job.error = err.message;
    job.finishedAt = new Date().toISOString();
    logger.error({ msg: 'Training process error', jobId, error: err.message });
    
    // Notify training error
    notificationService.notifyTrainingError(name, err.message);
    
    fs.writeFileSync(statusFile, JSON.stringify(job, null, 2));
  });

  return job;
}

export function getTrainingJob(jobId: string): TrainingJob | null {
  return jobs.get(jobId) || null;
}

export function getAllTrainingJobs(): TrainingJob[] {
  return Array.from(jobs.values()).sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return bTime - aTime; // Newest first
  });
}

export function cancelTrainingJob(jobId: string): boolean {
  const proc = jobProcesses.get(jobId);
  const job = jobs.get(jobId);

  if (proc && job) {
    proc.kill('SIGTERM');
    job.status = 'cancelled';
    job.error = 'Cancelled by user';
    job.finishedAt = new Date().toISOString();
    
    const statusFile = path.join('logs', 'train', `${jobId}.json`);
    fs.writeFileSync(statusFile, JSON.stringify(job, null, 2));
    
    logger.info({ msg: 'Training job cancelled', jobId });
    return true;
  }

  return false;
}

export function getTrainingLogs(jobId: string, limit = 100): string[] {
  const job = jobs.get(jobId);
  if (!job) return [];
  return job.logs.slice(-limit);
}

