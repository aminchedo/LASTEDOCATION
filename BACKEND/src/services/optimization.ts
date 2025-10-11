import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { OptimizationJob, HyperparameterConfig, TrialResult, ModelComparison, ComparisonResult, PruningConfig, QuantizationConfig, OptimizationMetrics } from '../types/optimization';
import { logger } from '../middleware/logger';

// In-memory storage for optimization jobs
const optimizationJobs = new Map<string, OptimizationJob>();
const jobProcesses = new Map<string, ChildProcess>();

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateJobId(): string {
  return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateTrialId(): string {
  return `trial_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// Hyperparameter sampling strategies
function sampleHyperparameters(config: HyperparameterConfig, strategy: 'grid' | 'random' | 'bayesian', trialNumber: number): Record<string, any> {
  const params: Record<string, any> = {};

  // Learning rate sampling
  if (strategy === 'random') {
    if (config.learningRate.distribution === 'log_uniform') {
      const min = Math.log(config.learningRate.min);
      const max = Math.log(config.learningRate.max);
      params.learningRate = Math.exp(min + Math.random() * (max - min));
    } else {
      params.learningRate = config.learningRate.min + Math.random() * (config.learningRate.max - config.learningRate.min);
    }
  } else if (strategy === 'grid') {
    const steps = config.learningRate.step || 3;
    const values = [];
    for (let i = 0; i < steps; i++) {
      values.push(config.learningRate.min + (i / (steps - 1)) * (config.learningRate.max - config.learningRate.min));
    }
    params.learningRate = values[trialNumber % values.length];
  } else {
    // Bayesian optimization (simplified)
    params.learningRate = config.learningRate.min + (trialNumber / 10) * (config.learningRate.max - config.learningRate.min);
  }

  // Batch size sampling
  params.batchSize = config.batchSize[trialNumber % config.batchSize.length];

  // Epochs sampling
  if (strategy === 'random') {
    params.epochs = Math.floor(config.epochs.min + Math.random() * (config.epochs.max - config.epochs.min + 1));
  } else {
    params.epochs = config.epochs.min + Math.floor((trialNumber / 10) * (config.epochs.max - config.epochs.min));
  }

  // Optional parameters
  if (config.warmupSteps) {
    params.warmupSteps = Math.floor(config.warmupSteps.min + Math.random() * (config.warmupSteps.max - config.warmupSteps.min + 1));
  }

  if (config.weightDecay) {
    params.weightDecay = config.weightDecay.min + Math.random() * (config.weightDecay.max - config.weightDecay.min);
  }

  if (config.dropout) {
    params.dropout = config.dropout.min + Math.random() * (config.dropout.max - config.dropout.min);
  }

  return params;
}

// Parse training logs to extract metrics
function parseOptimizationLogs(logs: string[]): TrialResult['metrics'] {
  let loss = 0;
  let accuracy = 0;
  let f1Score = 0;
  let precision = 0;
  let recall = 0;
  let perplexity = 0;

  for (const line of logs) {
    // Loss parsing
    const lossMatch = line.match(/(?:loss|train_loss)[:=]\s*([\d.]+)/i);
    if (lossMatch) {
      loss = parseFloat(lossMatch[1]);
    }

    // Accuracy parsing
    const accMatch = line.match(/(?:accuracy|acc)[:=]\s*([\d.]+)/i);
    if (accMatch) {
      accuracy = parseFloat(accMatch[1]);
    }

    // F1 Score parsing
    const f1Match = line.match(/(?:f1|f1_score)[:=]\s*([\d.]+)/i);
    if (f1Match) {
      f1Score = parseFloat(f1Match[1]);
    }

    // Precision parsing
    const precMatch = line.match(/(?:precision|prec)[:=]\s*([\d.]+)/i);
    if (precMatch) {
      precision = parseFloat(precMatch[1]);
    }

    // Recall parsing
    const recMatch = line.match(/(?:recall|rec)[:=]\s*([\d.]+)/i);
    if (recMatch) {
      recall = parseFloat(recMatch[1]);
    }

    // Perplexity parsing
    const perpMatch = line.match(/(?:perplexity|ppl)[:=]\s*([\d.]+)/i);
    if (perpMatch) {
      perplexity = parseFloat(perpMatch[1]);
    }
  }

  return {
    loss,
    accuracy,
    f1Score,
    precision,
    recall,
    perplexity: perplexity > 0 ? perplexity : undefined,
  };
}

export async function startOptimizationJob(
  name: string,
  baseModelPath: string,
  datasetPath: string,
  outputDir: string,
  config: HyperparameterConfig,
  strategy: 'grid' | 'random' | 'bayesian' = 'random',
  maxTrials: number = 10
): Promise<OptimizationJob> {
  const jobId = generateJobId();
  
  const job: OptimizationJob = {
    id: jobId,
    name,
    baseModelPath,
    datasetPath,
    outputDir,
    config,
    strategy,
    maxTrials,
    status: 'pending',
    progress: 0,
    currentTrial: 0,
    totalTrials: maxTrials,
    trials: [],
    startedAt: new Date().toISOString(),
  };

  optimizationJobs.set(jobId, job);

  // Ensure output directory
  ensureDir(outputDir);

  // Log directory
  const logDir = path.join('logs', 'optimization');
  ensureDir(logDir);
  const statusFile = path.join(logDir, `${jobId}.json`);

  // Write initial status
  fs.writeFileSync(statusFile, JSON.stringify(job, null, 2));

  logger.info({ msg: 'Starting optimization job', jobId, name, strategy, maxTrials });

  // Start optimization process
  await runOptimizationTrials(jobId);

  return job;
}

async function runOptimizationTrials(jobId: string) {
  const job = optimizationJobs.get(jobId);
  if (!job) return;

  job.status = 'running';

  for (let trialNum = 0; trialNum < job.maxTrials; trialNum++) {
    const trialId = generateTrialId();
    const trialParams = sampleHyperparameters(job.config, job.strategy, trialNum);
    
    const trial: TrialResult = {
      id: trialId,
      trialNumber: trialNum + 1,
      hyperparameters: trialParams,
      metrics: {
        loss: 0,
        accuracy: 0,
        f1Score: 0,
        precision: 0,
        recall: 0,
      },
      trainingTime: 0,
      status: 'running',
      outputPath: path.join(job.outputDir, `trial_${trialNum + 1}`),
      logs: [],
    };

    job.trials.push(trial);
    job.currentTrial = trialNum + 1;
    job.progress = Math.round(((trialNum + 1) / job.maxTrials) * 100);

    // Run individual trial
    try {
      await runSingleTrial(job, trial);
      trial.status = 'completed';
      
      // Update best trial if this one is better
      if (!job.bestTrial || trial.metrics.accuracy > job.bestTrial.metrics.accuracy) {
        job.bestTrial = trial;
      }
      
    } catch (error: any) {
      trial.status = 'failed';
      logger.error({ msg: 'Trial failed', jobId, trialId, error: error.message });
    }

    // Update status file
    const statusFile = path.join('logs', 'optimization', `${jobId}.json`);
    fs.writeFileSync(statusFile, JSON.stringify(job, null, 2));
  }

  job.status = 'completed';
  job.finishedAt = new Date().toISOString();
  
  logger.info({ msg: 'Optimization completed', jobId, bestAccuracy: job.bestTrial?.metrics.accuracy });
}

async function runSingleTrial(job: OptimizationJob, trial: TrialResult): Promise<void> {
  const startTime = Date.now();
  
  // Create trial output directory
  ensureDir(trial.outputPath);

  // Prepare training arguments
  const args = [
    path.join(__dirname, '../../scripts/train_minimal.ts'),
    '--job-id', trial.id,
    '--base-model', job.baseModelPath,
    '--dataset', job.datasetPath,
    '--output', trial.outputPath,
    '--epochs', trial.hyperparameters.epochs.toString(),
    '--lr', trial.hyperparameters.learningRate.toString(),
    '--batch-size', trial.hyperparameters.batchSize.toString(),
  ];

  if (trial.hyperparameters.warmupSteps) {
    args.push('--warmup-steps', trial.hyperparameters.warmupSteps.toString());
  }

  if (trial.hyperparameters.weightDecay) {
    args.push('--weight-decay', trial.hyperparameters.weightDecay.toString());
  }

  // Spawn training process
  const proc = spawn('ts-node', args, {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'optimization' }
  });

  // Capture stdout
  proc.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        trial.logs.push(line.trim());
      }
    }
  });

  // Capture stderr
  proc.stderr.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        trial.logs.push(`[ERROR] ${line.trim()}`);
      }
    }
  });

  // Wait for completion
  return new Promise((resolve, reject) => {
    proc.on('close', (code: number) => {
      trial.trainingTime = Math.round((Date.now() - startTime) / 1000);
      
      if (code === 0) {
        // Parse metrics from logs
        trial.metrics = parseOptimizationLogs(trial.logs);
        resolve();
      } else {
        reject(new Error(`Trial process exited with code ${code}`));
      }
    });

    proc.on('error', (err: Error) => {
      reject(err);
    });
  });
}

export function getOptimizationJob(jobId: string): OptimizationJob | null {
  return optimizationJobs.get(jobId) || null;
}

export function getAllOptimizationJobs(): OptimizationJob[] {
  return Array.from(optimizationJobs.values()).sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return bTime - aTime; // Newest first
  });
}

export function cancelOptimizationJob(jobId: string): boolean {
  const proc = jobProcesses.get(jobId);
  const job = optimizationJobs.get(jobId);

  if (proc && job) {
    proc.kill('SIGTERM');
    job.status = 'cancelled';
    job.error = 'Cancelled by user';
    job.finishedAt = new Date().toISOString();
    
    const statusFile = path.join('logs', 'optimization', `${jobId}.json`);
    fs.writeFileSync(statusFile, JSON.stringify(job, null, 2));
    
    logger.info({ msg: 'Optimization job cancelled', jobId });
    return true;
  }

  return false;
}

// Model comparison functionality
export async function createModelComparison(
  name: string,
  modelPaths: string[],
  testDataset: string,
  comparisonMetrics: string[]
): Promise<ModelComparison> {
  const comparisonId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const comparison: ModelComparison = {
    id: comparisonId,
    name,
    models: modelPaths.map((path, index) => ({
      id: `model_${index}`,
      name: `Model ${index + 1}`,
      path,
      metrics: {},
      size: 0,
      inferenceTime: 0,
    })),
    testDataset,
    comparisonMetrics,
    createdAt: new Date().toISOString(),
  };

  // Run comparison (simplified for now)
  comparison.results = await runModelComparison(comparison);
  
  return comparison;
}

async function runModelComparison(comparison: ModelComparison): Promise<ComparisonResult[]> {
  const results: ComparisonResult[] = [];
  
  for (let i = 0; i < comparison.models.length; i++) {
    const model = comparison.models[i];
    
    // Simulate model evaluation
    const metrics: Record<string, number> = {};
    for (const metric of comparison.comparisonMetrics) {
      metrics[metric] = Math.random() * 100; // Placeholder
    }
    
    results.push({
      modelId: model.id,
      modelName: model.name,
      metrics,
      ranking: i + 1,
      performance: 'good' as const,
    });
  }
  
  // Sort by primary metric (accuracy)
  results.sort((a, b) => (b.metrics.accuracy || 0) - (a.metrics.accuracy || 0));
  
  // Update rankings
  results.forEach((result, index) => {
    result.ranking = index + 1;
  });
  
  return results;
}

// Pruning functionality
export async function pruneModel(
  modelPath: string,
  outputPath: string,
  config: PruningConfig
): Promise<{ success: boolean; message: string; newSize?: number }> {
  try {
    // Create pruning script path
    const scriptPath = path.join(__dirname, '../../scripts/prune_model.ts');
    
    const args = [
      scriptPath,
      '--input', modelPath,
      '--output', outputPath,
      '--method', config.method,
      '--sparsity', config.sparsity.toString(),
      '--structured', config.structured.toString(),
      '--gradual', config.gradual.toString(),
    ];

    // Spawn pruning process
    const proc = spawn('ts-node', args, {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'pruning' }
    });

    return new Promise((resolve, reject) => {
      proc.on('close', (code: number) => {
        if (code === 0) {
          // Calculate new size
          const newSize = getDirectorySize(outputPath);
          resolve({
            success: true,
            message: 'Model pruned successfully',
            newSize,
          });
        } else {
          reject(new Error(`Pruning process exited with code ${code}`));
        }
      });

      proc.on('error', (err: Error) => {
        reject(err);
      });
    });
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

// Quantization functionality
export async function quantizeModel(
  modelPath: string,
  outputPath: string,
  config: QuantizationConfig
): Promise<{ success: boolean; message: string; newSize?: number }> {
  try {
    // Create quantization script path
    const scriptPath = path.join(__dirname, '../../scripts/quantize_model.ts');
    
    const args = [
      scriptPath,
      '--input', modelPath,
      '--output', outputPath,
      '--method', config.method,
      '--bits', config.bits.toString(),
      '--symmetric', config.symmetric.toString(),
    ];

    if (config.calibrationDataset) {
      args.push('--calibration-dataset', config.calibrationDataset);
    }

    // Spawn quantization process
    const proc = spawn('ts-node', args, {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'quantization' }
    });

    return new Promise((resolve, reject) => {
      proc.on('close', (code: number) => {
        if (code === 0) {
          // Calculate new size
          const newSize = getDirectorySize(outputPath);
          resolve({
            success: true,
            message: 'Model quantized successfully',
            newSize,
          });
        } else {
          reject(new Error(`Quantization process exited with code ${code}`));
        }
      });

      proc.on('error', (err: Error) => {
        reject(err);
      });
    });
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

function getDirectorySize(dirPath: string): number {
  try {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  } catch {
    return 0;
  }
}

export function getOptimizationMetrics(): OptimizationMetrics {
  const jobs = Array.from(optimizationJobs.values());
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const allTrials = completedJobs.flatMap(job => job.trials);
  const successfulTrials = allTrials.filter(trial => trial.status === 'completed');
  
  const totalOptimizations = completedJobs.length;
  const averageImprovement = completedJobs.length > 0 
    ? completedJobs.reduce((sum, job) => {
        const baseline = job.trials[0]?.metrics.accuracy || 0;
        const best = job.bestTrial?.metrics.accuracy || 0;
        return sum + ((best - baseline) / baseline) * 100;
      }, 0) / completedJobs.length
    : 0;
  
  const bestModelAccuracy = Math.max(...successfulTrials.map(trial => trial.metrics.accuracy), 0);
  const totalTrainingTime = successfulTrials.reduce((sum, trial) => sum + trial.trainingTime, 0) / 3600; // hours
  const averageTrialTime = successfulTrials.length > 0 
    ? successfulTrials.reduce((sum, trial) => sum + trial.trainingTime, 0) / successfulTrials.length / 60 // minutes
    : 0;
  
  return {
    totalOptimizations,
    averageImprovement,
    bestModelAccuracy,
    totalTrainingTime,
    successfulTrials: successfulTrials.length,
    failedTrials: allTrials.length - successfulTrials.length,
    averageTrialTime,
  };
}
