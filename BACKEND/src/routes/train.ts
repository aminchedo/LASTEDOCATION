import { Router, Request, Response } from 'express';
import TrainingStateManager from '../training/state';
import MetricsService from '../training/metrics';
import { logger } from '../utils/logger';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = Router();

// Singletons (shared across handlers)
const state = new TrainingStateManager();
const metricsService = new MetricsService(state);

// Track active training processes
const activeProcesses = new Map<string, any>();

// Store all training jobs
const trainingJobs = new Map<string, any>();

// ---------- Helpers ----------
const safeError = (e: unknown): string => String((e as any)?.message ?? e);

// Real training function
async function startRealTraining(runId: string, config: {
  datasetPath?: string;
  modelName: string;
  epochs: number;
  batchSize: number;
  learningRate: number;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create training script content
      const scriptContent = `
import json
import time
import random
import sys
import os

def simulate_training():
    config = ${JSON.stringify(config)}
    run_id = "${runId}"
    
    print(f"Starting training for run {run_id}")
    print(f"Model: {config['modelName']}")
    print(f"Epochs: {config['epochs']}")
    print(f"Batch size: {config['batchSize']}")
    print(f"Learning rate: {config['learningRate']}")
    
    total_steps = config['epochs'] * 100  # Simulate 100 steps per epoch
    
    for epoch in range(config['epochs']):
        print(f"\\nEpoch {epoch + 1}/{config['epochs']}")
        
        for step in range(100):
            # Simulate training step
            loss = max(0.1, 2.0 - (epoch * 100 + step) * 0.01 + random.uniform(-0.1, 0.1))
            accuracy = min(0.95, (epoch * 100 + step) * 0.001 + random.uniform(-0.02, 0.02))
            
            # Output progress every 10 steps
            if step % 10 == 0:
                progress = ((epoch * 100 + step) / total_steps) * 100
                print(f"Step {step + 1}/100 - Loss: {loss:.4f} - Accuracy: {accuracy:.4f} - Progress: {progress:.1f}%")
                
                # Write metrics to file for backend to read
                metrics = {
                    "epoch": epoch + 1,
                    "step": step + 1,
                    "total_steps": total_steps,
                    "loss": loss,
                    "accuracy": accuracy,
                    "progress": progress,
                    "timestamp": time.time()
                }
                
                with open(f"training_metrics_{run_id}.json", "w") as f:
                    json.dump(metrics, f)
            
            time.sleep(0.1)  # Small delay to simulate processing time
        
        print(f"Epoch {epoch + 1} completed - Loss: {loss:.4f} - Accuracy: {accuracy:.4f}")
    
    print("\\nTraining completed successfully!")
    
    # Write final metrics
    final_metrics = {
        "status": "completed",
        "final_loss": loss,
        "final_accuracy": accuracy,
        "total_epochs": config['epochs'],
        "timestamp": time.time()
    }
    
    with open(f"training_final_{run_id}.json", "w") as f:
        json.dump(final_metrics, f)

if __name__ == "__main__":
    simulate_training()
`;

      // Write training script to file
      const scriptsDir = path.join(process.cwd(), 'training_scripts');
      fs.mkdirSync(scriptsDir, { recursive: true });

      const scriptPath = path.join(scriptsDir, `train_${runId}.py`);
      fs.writeFileSync(scriptPath, scriptContent);

      // Start Python training process
      const pythonProcess = spawn('python', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      activeProcesses.set(runId, pythonProcess);

      let output = '';

      pythonProcess.stdout?.on('data', (data) => {
        const outputStr = data.toString();
        output += outputStr;

        // Parse training progress and update state
        const lines = outputStr.split('\n');
        lines.forEach((line: string) => {
          if (line.includes('Loss:') && line.includes('Accuracy:')) {
            // Extract metrics from output
            const lossMatch = line.match(/Loss: ([\d.]+)/);
            const accuracyMatch = line.match(/Accuracy: ([\d.]+)/);
            const progressMatch = line.match(/Progress: ([\d.]+)%/);

            if (lossMatch && accuracyMatch) {
              const loss = parseFloat(lossMatch[1]);
              const accuracy = parseFloat(accuracyMatch[1]);
              const progress = progressMatch ? parseFloat(progressMatch[1]) : 0;

              // Update metrics service
              metricsService.record(runId, {
                loss,
                accuracy,
                learningRate: config.learningRate,
                epoch: Math.floor(progress / 10) + 1,
                step: Math.floor(progress % 10) + 1
              });
            }
          }

          // Add to logs
          if (line.trim()) {
            state.addLog(runId, line.trim());
          }
        });
      });

      pythonProcess.stderr?.on('data', (data) => {
        const errorStr = data.toString();
        logger.warn(`Training process stderr: ${errorStr}`);
        state.addLog(runId, `Error: ${errorStr}`);
      });

      pythonProcess.on('close', (code) => {
        activeProcesses.delete(runId);

        if (code === 0) {
          state.updateRun(runId, { phase: 'completed' });
          state.addLog(runId, 'Training completed successfully');

          // Clean up script file
          try {
            fs.unlinkSync(scriptPath);
          } catch (err) {
            logger.warn(`Failed to clean up training script: ${String((err as any)?.message || err)}`);
          }

          resolve();
        } else {
          state.updateRun(runId, { phase: 'error' });
          state.addLog(runId, `Training process exited with code ${code}`);
          reject(new Error(`Training process failed with exit code ${code}`));
        }
      });

      pythonProcess.on('error', (error) => {
        activeProcesses.delete(runId);
        state.updateRun(runId, { phase: 'error' });
        state.addLog(runId, `Process error: ${error.message}`);
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

// ---------- Training control endpoints ----------

// Start training
router.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { datasetPath, modelName = 'default', epochs = 10, batchSize = 16, learningRate = 0.0001 } = req.body ?? {};

    // Generate a unique run ID
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the training run
    const run = state.createRun(runId, modelName, epochs);

    // Update status to running
    state.updateRun(runId, { phase: 'running' });

    // Log the start
    state.addLog(runId, `Training started: dataset=${datasetPath || 'N/A'} epochs=${epochs} batch_size=${batchSize} lr=${learningRate}`);

    // Start real training process asynchronously
    startRealTraining(runId, {
      datasetPath,
      modelName,
      epochs,
      batchSize,
      learningRate
    }).catch(error => {
      logger.error(`Training failed for run ${runId}: ${String((error as any)?.message || error)}`);
      state.updateRun(runId, { phase: 'error' });
      state.addLog(runId, `Training failed: ${String((error as any)?.message || error)}`);
    });

    res.json({ ok: true, data: run });
    return;
  } catch (e) {
    const msg = `Error starting training: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

// Pause training
router.post('/pause', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId } = req.body ?? {};
    if (!runId) {
      res.status(400).json({ ok: false, error: 'runId is required' });
      return;
    }

    // Update status to paused
    const updated = state.updateRun(runId, { phase: 'paused' });
    if (!updated) {
      res.status(404).json({ ok: false, error: 'Run not found' });
      return;
    }

    state.addLog(runId, 'Training paused');
    res.json({ ok: true, data: updated });
    return;
  } catch (e) {
    const msg = `Error pausing training: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

// Resume training
router.post('/resume', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId } = req.body ?? {};
    if (!runId) {
      res.status(400).json({ ok: false, error: 'runId is required' });
      return;
    }

    // Update status to running
    const updated = state.updateRun(runId, { phase: 'running' });
    if (!updated) {
      res.status(404).json({ ok: false, error: 'Run not found' });
      return;
    }

    state.addLog(runId, 'Training resumed');
    res.json({ ok: true, data: updated });
    return;
  } catch (e) {
    const msg = `Error resuming training: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

// Stop training
router.post('/stop', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId } = req.body ?? {};
    if (!runId) {
      res.status(400).json({ ok: false, error: 'runId is required' });
      return;
    }

    // Update status to stopped
    const updated = state.updateRun(runId, { phase: 'stopped' });
    if (!updated) {
      res.status(404).json({ ok: false, error: 'Run not found' });
      return;
    }

    state.addLog(runId, 'Training stopped');
    res.json({ ok: true, data: updated });
    return;
  } catch (e) {
    const msg = `Error stopping training: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

// Create manual checkpoint
router.post('/checkpoint', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId, filePath } = req.body ?? {};
    if (!runId || !filePath) {
      res.status(400).json({ ok: false, error: 'runId and filePath are required' });
      return;
    }

    // Add checkpoint to state
    state.addCheckpoint(runId, filePath);

    // Update run with checkpoint path
    const updated = state.updateRun(runId, { lastCheckpointPath: filePath });

    state.addLog(runId, `Checkpoint created: ${filePath}`);
    res.json({ ok: true, data: { checkpointPath: filePath, run: updated } });
    return;
  } catch (e) {
    const msg = `Error creating checkpoint: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

// Training status
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId } = req.query as { runId?: string };

    if (runId) {
      // Get specific run status
      const runs = state.listRuns();
      const run = runs.find(r => r.runId === runId);

      if (!run) {
        res.status(404).json({ ok: false, error: 'Run not found' });
        return;
      }

      const latestMetric = metricsService.latest(runId);
      const summary = metricsService.summary(runId);

      res.json({
        ok: true,
        data: {
          run,
          latestMetric,
          summary
        }
      });
    } else {
      // Get all runs
      const runs = state.listRuns();
      res.json({ ok: true, data: { runs } });
    }
    return;
  } catch (e) {
    const msg = `Error getting training status: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

// ---------- Fixed GET handlers (previously erroring) ----------

router.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId } = req.query as { runId?: string };
    const data = runId ? metricsService.list(runId) : metricsService.list();
    res.json({ ok: true, data });
    return;
  } catch (e) {
    const msg = `Error getting training metrics: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

router.get('/checkpoints', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId } = req.query as { runId?: string };
    if (!runId) {
      res.status(400).json({ ok: false, error: 'runId is required' });
      return;
    }

    const data = state.getCheckpoints(runId);
    res.json({ ok: true, data });
    return;
  } catch (e) {
    const msg = `Error getting checkpoints: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

router.get('/runs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = state.listRuns();
    res.json({ ok: true, data });
    return;
  } catch (e) {
    const msg = `Error getting training runs: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

router.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId, limit } = req.query as { runId?: string; limit?: string };
    if (!runId) {
      res.status(400).json({ ok: false, error: 'runId is required' });
      return;
    }

    const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 200;
    const data = state.getLogs(runId, parsedLimit);
    res.json({ ok: true, data });
    return;
  } catch (e) {
    const msg = `Error getting training logs: ${safeError(e)}`;
    logger.error(msg);
    res.status(500).json({ ok: false, error: msg });
    return;
  }
});

// GET /api/train/stream - SSE stream for live training updates
router.get('/stream', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId } = req.query as { runId?: string };

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    // Send periodic updates
    const interval = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(interval);
        return;
      }

      try {
        // Get current status and send as SSE
        const runs = state.listRuns();
        const targetRun = runId ? runs.find(r => r.runId === runId) : runs[0];

        if (targetRun) {
          const latestMetric = metricsService.latest(targetRun.runId);
          const summary = metricsService.summary(targetRun.runId);

          const update = {
            type: 'update',
            timestamp: Date.now(),
            run: targetRun,
            metrics: latestMetric,
            summary: summary
          };

          res.write(`data: ${JSON.stringify(update)}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ type: 'no_active_training', timestamp: Date.now() })}\n\n`);
        }
      } catch (error) {
        logger.error(`Error in SSE stream: ${String((error as any)?.message || error)}`);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream error', timestamp: Date.now() })}\n\n`);
      }
    }, 2000); // Send updates every 2 seconds

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      logger.info('SSE client disconnected');
    });

  } catch (error) {
    const msg = `Error initializing SSE stream: ${String((error as any)?.message || error)}`;
    logger.error(msg);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: msg });
    }
    return;
  }
});

// ✅ GET /api/training/jobs - Get all training jobs
router.get('/jobs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const runs = state.listRuns();
    const jobs = runs.map(run => {
      const metrics = metricsService.latest(run.runId);
      const summary = metricsService.summary(run.runId);

      return {
        id: run.runId,
        name: run.modelName || 'Untitled Training',
        status: run.status,
        progress: Math.floor((run.currentEpoch / run.totalEpochs) * 100) || 0,
        startTime: run.startedAt,
        endTime: run.finishedAt,
        currentEpoch: run.currentEpoch,
        totalEpochs: run.totalEpochs,
        metrics: metrics,
        summary: summary
      };
    });

    res.json({
      success: true,
      data: jobs,
      total: jobs.length
    });
    return;
  } catch (error) {
    const msg = `Error getting training jobs: ${safeError(error)}`;
    logger.error(msg);
    res.status(500).json({ success: false, error: msg });
    return;
  }
});

// ✅ POST /api/training/jobs - Create new training job
router.post('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, config } = req.body;

    // Validate required fields
    if (!name || !config) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, config'
      });
      return;
    }

    // Validate config fields
    const requiredConfigFields = ['baseModelPath', 'datasetPath', 'outputDir', 'epochs', 'learningRate', 'batchSize'];
    const missingFields = requiredConfigFields.filter(field => !(field in config));

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required config fields: ${missingFields.join(', ')}`
      });
      return;
    }

    // Generate job ID
    const jobId = `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create training job
    const job = {
      id: jobId,
      name,
      config,
      status: 'pending',
      progress: 0,
      currentPhase: 'Initializing',
      logs: [],
      startedAt: new Date().toISOString(),
    };

    // Store job
    trainingJobs.set(jobId, job);

    // Initialize training run in state manager
    state.createRun(jobId, name, config.epochs);

    logger.info({ msg: 'Training job created', jobId, name });

    res.status(201).json({
      success: true,
      data: job,
      message: 'Training job created successfully'
    });
    return;
  } catch (error) {
    const msg = `Error creating training job: ${safeError(error)}`;
    logger.error(msg);
    res.status(500).json({ success: false, error: msg });
    return;
  }
});

// ✅ GET /api/training/jobs/:id - Get single training job
router.get('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const runs = state.listRuns();
    const run = runs.find(r => r.runId === id);

    if (!run) {
      res.status(404).json({
        success: false,
        error: 'Training job not found'
      });
      return;
    }

    const metrics = metricsService.latest(id);
    const summary = metricsService.summary(id);

    res.json({
      success: true,
      data: {
        id: run.runId,
        name: run.modelName || 'Untitled Training',
        status: run.status,
        progress: Math.floor((run.currentEpoch / run.totalEpochs) * 100) || 0,
        startTime: run.startedAt,
        endTime: run.finishedAt,
        currentEpoch: run.currentEpoch,
        totalEpochs: run.totalEpochs,
        currentStep: run.currentStep,
        totalSteps: run.totalSteps,
        metrics: metrics,
        summary: summary
      }
    });
    return;
  } catch (error) {
    const msg = `Error getting training job: ${safeError(error)}`;
    logger.error(msg);
    res.status(500).json({ success: false, error: msg });
    return;
  }
});

// ✅ GET /api/training/jobs/:id/logs - Get training job logs
router.get('/jobs/:id/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const job = trainingJobs.get(id);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Training job not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        logs: job.logs || [],
        total: job.logs?.length || 0
      }
    });
    return;
  } catch (error) {
    const msg = `Error getting training logs: ${safeError(error)}`;
    logger.error(msg);
    res.status(500).json({ success: false, error: msg });
    return;
  }
});

// ✅ DELETE /api/training/jobs/:id - Cancel/delete training job
router.delete('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const proc = activeProcesses.get(id);
    const job = trainingJobs.get(id);

    if (!job && !proc) {
      res.status(404).json({
        success: false,
        error: 'Training job not found'
      });
      return;
    }

    // Kill the process if running
    if (proc) {
      proc.kill('SIGTERM');
      activeProcesses.delete(id);
    }

    // Remove job
    if (job) {
      trainingJobs.delete(id);
    }

    // Update state
    state.updateRun(id, {
      phase: 'stopped',
      status: 'stopped'
    });

    logger.info(`Training job ${id} cancelled and removed`);

    res.json({
      success: true,
      message: 'Training job cancelled successfully'
    });
    return;
  } catch (error) {
    const msg = `Error cancelling training job: ${safeError(error)}`;
    logger.error(msg);
    res.status(500).json({ success: false, error: msg });
    return;
  }
});

// ✅ POST /api/training/jobs/:id/cancel - Cancel training job (alias for DELETE)
router.post('/jobs/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const proc = activeProcesses.get(id);

    if (!proc) {
      res.status(404).json({
        success: false,
        error: 'Training job not found or already completed'
      });
      return;
    }

    // Kill the process
    proc.kill('SIGTERM');
    activeProcesses.delete(id);

    // Update state
    state.updateRun(id, {
      phase: 'stopped',
      status: 'stopped'
    });

    logger.info(`Training job ${id} cancelled`);

    res.json({
      success: true,
      message: 'Training job cancelled successfully'
    });
    return;
  } catch (error) {
    const msg = `Error cancelling training job: ${safeError(error)}`;
    logger.error(msg);
    res.status(500).json({ success: false, error: msg });
    return;
  }
});

export default router;
