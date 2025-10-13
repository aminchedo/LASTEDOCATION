/**
 * Training job API - Unified endpoint for training management
 * Provides endpoints for starting, stopping, querying, and downloading training jobs
 */
import express from "express";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

const router = express.Router();

// Ensure artifacts directory exists
const ARTIFACTS_DIR = path.join(process.cwd(), "artifacts", "jobs");
const MODELS_DIR = path.join(process.cwd(), "models");

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

// In-memory process tracking
const ACTIVE_JOBS: Record<string, { pid: number; process: ChildProcess }> = {};

/**
 * Write job status to disk
 */
function writeStatus(jobId: string, payload: any) {
  const statusPath = path.join(ARTIFACTS_DIR, `${jobId}.json`);
  fs.writeFileSync(statusPath, JSON.stringify(payload, null, 2), { encoding: "utf-8" });
}

/**
 * Read job status from disk
 */
function readStatus(jobId: string): any | null {
  const statusPath = path.join(ARTIFACTS_DIR, `${jobId}.json`);
  if (fs.existsSync(statusPath)) {
    try {
      const content = fs.readFileSync(statusPath, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * POST /api/training
 * Start a new training job
 * 
 * Body params:
 * - dataset: path to dataset file (optional)
 * - epochs: number of epochs (default: 3)
 * - batch_size: batch size (default: 16)
 * - lr: learning rate (default: 0.01)
 */
router.post("/", express.json(), (req, res): any => {
  try {
    const params = req.body || {};
    const jobId = `job_${Date.now()}_${randomBytes(4).toString("hex")}`;
    const dataset = params.dataset || params.dataset_path || null;
    const epochs = params.epochs || 3;
    const batch_size = params.batch_size || 16;
    const lr = params.lr || 0.01;

    // Python script path (go up one level from BACKEND to root)
    let scriptPath = path.join(process.cwd(), "..", "scripts", "train_minimal_job.py");
    
    // Fallback to simulation if PyTorch version doesn't exist
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(process.cwd(), "..", "scripts", "train_simulation_fallback.py");
    }
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({
        ok: false,
        error: `Training script not found: ${scriptPath}`
      });
    }

    // Build command arguments
    const args = [
      scriptPath,
      "--job_id", jobId,
      "--epochs", String(epochs),
      "--batch-size", String(batch_size),
      "--lr", String(lr)
    ];
    
    if (dataset) {
      args.push("--dataset", dataset);
    }

    // Spawn Python process (detached so it survives server restart)
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const child = spawn(pythonCmd, args, {
      detached: true,
      stdio: ["ignore", "ignore", "ignore"]
    });

    // Detach so process continues independently
    child.unref();

    // Track the process
    ACTIVE_JOBS[jobId] = {
      pid: child.pid!,
      process: child
    };

    // Write initial status
    const initialStatus = {
      job_id: jobId,
      status: "QUEUED",
      progress: 0,
      pid: child.pid,
      params: { dataset, epochs, batch_size, lr },
      created_at: new Date().toISOString()
    };
    writeStatus(jobId, initialStatus);

    // Respond immediately
    res.json({
      ok: true,
      job_id: jobId,
      pid: child.pid,
      status: "QUEUED",
      message: "Training job started"
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: String(err.message || err)
    });
  }
});

/**
 * GET /api/training/status?job_id=xxx
 * Get status of a training job
 */
router.get("/status", (req, res): any => {
  const jobId = String(req.query.job_id || "");
  
  if (!jobId) {
    return res.status(400).json({
      ok: false,
      error: "job_id parameter required"
    });
  }

  // Try to read status from disk
  const status = readStatus(jobId);
  
  if (status) {
    return res.json({
      ok: true,
      status: status
    });
  }

  // Check if job exists in memory
  if (ACTIVE_JOBS[jobId]) {
    return res.json({
      ok: true,
      status: {
        job_id: jobId,
        status: "RUNNING",
        pid: ACTIVE_JOBS[jobId].pid,
        message: "Job running but status file not yet available"
      }
    });
  }

  // Job not found
  return res.status(404).json({
    ok: false,
    error: "Job not found"
  });
});

/**
 * POST /api/training/:jobId/stop
 * Stop a running training job
 */
router.post("/:jobId/stop", express.json(), (req, res): any => {
  const jobId = req.params.jobId || String((req.body && req.body.job_id) || "");
  
  if (!jobId) {
    return res.status(400).json({
      ok: false,
      error: "job_id parameter required"
    });
  }

  const job = ACTIVE_JOBS[jobId];
  
  if (!job) {
    return res.status(404).json({
      ok: false,
      error: "Job not found or not running"
    });
  }

  try {
    // Kill the process
    process.kill(job.pid, "SIGTERM");
    
    // Update status
    const currentStatus = readStatus(jobId) || { job_id: jobId };
    const stoppedStatus = {
      ...currentStatus,
      status: "STOPPED",
      stopped_at: new Date().toISOString(),
      message: "Training stopped by user"
    };
    writeStatus(jobId, stoppedStatus);
    
    // Remove from active jobs
    delete ACTIVE_JOBS[jobId];
    
    return res.json({
      ok: true,
      job_id: jobId,
      status: "STOPPED",
      message: "Training job stopped"
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: `Failed to stop job: ${err.message || err}`
    });
  }
});

/**
 * GET /api/training/jobs
 * List all training jobs
 */
router.get("/jobs", (req, res): any => {
  try {
    const files = fs.readdirSync(ARTIFACTS_DIR);
    const jobs = files
      .filter(f => f.endsWith(".json"))
      .map(f => {
        try {
          const content = fs.readFileSync(path.join(ARTIFACTS_DIR, f), "utf-8");
          return JSON.parse(content);
        } catch (e) {
          return null;
        }
      })
      .filter(j => j !== null);
    
    res.json({
      ok: true,
      jobs: jobs,
      count: jobs.length
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: String(err.message || err)
    });
  }
});

/**
 * GET /api/training/:jobId/download
 * Download trained model
 */
router.get("/:jobId/download", (req, res): any => {
  const jobId = req.params.jobId;
  
  if (!jobId) {
    return res.status(400).json({
      ok: false,
      error: "job_id parameter required"
    });
  }

  // Check job status first
  const status = readStatus(jobId);
  if (!status) {
    return res.status(404).json({
      ok: false,
      error: "Job not found"
    });
  }

  if (status.status !== "COMPLETED") {
    return res.status(400).json({
      ok: false,
      error: `Job is not completed yet. Current status: ${status.status}`
    });
  }

  // Try to find the model file
  const modelPath = path.join(MODELS_DIR, `${jobId}.pt`);
  
  if (!fs.existsSync(modelPath)) {
    return res.status(404).json({
      ok: false,
      error: "Model file not found"
    });
  }

  // Send the file
  res.download(modelPath, `${jobId}.pt`, (err) => {
    if (err) {
      console.error("Download error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          ok: false,
          error: "Failed to download model"
        });
      }
    }
  });
});

export default router;
