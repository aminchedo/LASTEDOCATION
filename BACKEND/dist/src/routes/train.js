"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const state_1 = __importDefault(require("../training/state"));
const metrics_1 = __importDefault(require("../training/metrics"));
const logger_1 = require("../utils/logger");
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Singletons (shared across handlers)
const state = new state_1.default();
const metricsService = new metrics_1.default(state);
// Track active training processes
const activeProcesses = new Map();
// ---------- Helpers ----------
const safeError = (e) => String(e?.message ?? e);
// Real training function
async function startRealTraining(runId, config) {
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
            const scriptsDir = path_1.default.join(process.cwd(), 'training_scripts');
            fs_1.default.mkdirSync(scriptsDir, { recursive: true });
            const scriptPath = path_1.default.join(scriptsDir, `train_${runId}.py`);
            fs_1.default.writeFileSync(scriptPath, scriptContent);
            // Start Python training process
            const pythonProcess = (0, child_process_1.spawn)('python', [scriptPath], {
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
                lines.forEach((line) => {
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
                logger_1.logger.warn(`Training process stderr: ${errorStr}`);
                state.addLog(runId, `Error: ${errorStr}`);
            });
            pythonProcess.on('close', (code) => {
                activeProcesses.delete(runId);
                if (code === 0) {
                    state.updateRun(runId, { phase: 'completed' });
                    state.addLog(runId, 'Training completed successfully');
                    // Clean up script file
                    try {
                        fs_1.default.unlinkSync(scriptPath);
                    }
                    catch (err) {
                        logger_1.logger.warn(`Failed to clean up training script: ${String(err?.message || err)}`);
                    }
                    resolve();
                }
                else {
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
        }
        catch (error) {
            reject(error);
        }
    });
}
// ---------- Training control endpoints ----------
// Start training
router.post('/start', async (req, res) => {
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
            logger_1.logger.error(`Training failed for run ${runId}: ${String(error?.message || error)}`);
            state.updateRun(runId, { phase: 'error' });
            state.addLog(runId, `Training failed: ${String(error?.message || error)}`);
        });
        res.json({ ok: true, data: run });
        return;
    }
    catch (e) {
        const msg = `Error starting training: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
// Pause training
router.post('/pause', async (req, res) => {
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
    }
    catch (e) {
        const msg = `Error pausing training: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
// Resume training
router.post('/resume', async (req, res) => {
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
    }
    catch (e) {
        const msg = `Error resuming training: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
// Stop training
router.post('/stop', async (req, res) => {
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
    }
    catch (e) {
        const msg = `Error stopping training: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
// Create manual checkpoint
router.post('/checkpoint', async (req, res) => {
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
    }
    catch (e) {
        const msg = `Error creating checkpoint: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
// Training status
router.get('/status', async (req, res) => {
    try {
        const { runId } = req.query;
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
        }
        else {
            // Get all runs
            const runs = state.listRuns();
            res.json({ ok: true, data: { runs } });
        }
        return;
    }
    catch (e) {
        const msg = `Error getting training status: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
// ---------- Fixed GET handlers (previously erroring) ----------
router.get('/metrics', async (req, res) => {
    try {
        const { runId } = req.query;
        const data = runId ? metricsService.list(runId) : metricsService.list();
        res.json({ ok: true, data });
        return;
    }
    catch (e) {
        const msg = `Error getting training metrics: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
router.get('/checkpoints', async (req, res) => {
    try {
        const { runId } = req.query;
        if (!runId) {
            res.status(400).json({ ok: false, error: 'runId is required' });
            return;
        }
        const data = state.getCheckpoints(runId);
        res.json({ ok: true, data });
        return;
    }
    catch (e) {
        const msg = `Error getting checkpoints: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
router.get('/runs', async (_req, res) => {
    try {
        const data = state.listRuns();
        res.json({ ok: true, data });
        return;
    }
    catch (e) {
        const msg = `Error getting training runs: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
router.get('/logs', async (req, res) => {
    try {
        const { runId, limit } = req.query;
        if (!runId) {
            res.status(400).json({ ok: false, error: 'runId is required' });
            return;
        }
        const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 200;
        const data = state.getLogs(runId, parsedLimit);
        res.json({ ok: true, data });
        return;
    }
    catch (e) {
        const msg = `Error getting training logs: ${safeError(e)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
// GET /api/train/stream - SSE stream for live training updates
router.get('/stream', async (req, res) => {
    try {
        const { runId } = req.query;
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
                }
                else {
                    res.write(`data: ${JSON.stringify({ type: 'no_active_training', timestamp: Date.now() })}\n\n`);
                }
            }
            catch (error) {
                logger_1.logger.error(`Error in SSE stream: ${String(error?.message || error)}`);
                res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream error', timestamp: Date.now() })}\n\n`);
            }
        }, 2000); // Send updates every 2 seconds
        // Cleanup on client disconnect
        req.on('close', () => {
            clearInterval(interval);
            logger_1.logger.info('SSE client disconnected');
        });
    }
    catch (error) {
        const msg = `Error initializing SSE stream: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: msg });
        }
        return;
    }
});
exports.default = router;
//# sourceMappingURL=train.js.map