"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Training job API - Unified endpoint for training management
 * Provides endpoints for starting, stopping, querying, and downloading training jobs
 */
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = require("crypto");
const auth_1 = require("../middleware/auth");
const websocket_service_1 = require("../services/websocket.service");
const router = express_1.default.Router();
// Ensure artifacts directory exists
const ARTIFACTS_DIR = path_1.default.join(process.cwd(), "artifacts", "jobs");
const MODELS_DIR = path_1.default.join(process.cwd(), "models");
if (!fs_1.default.existsSync(ARTIFACTS_DIR)) {
    fs_1.default.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}
if (!fs_1.default.existsSync(MODELS_DIR)) {
    fs_1.default.mkdirSync(MODELS_DIR, { recursive: true });
}
// In-memory process tracking
const ACTIVE_JOBS = {};
/**
 * Write job status to disk
 */
function writeStatus(jobId, payload) {
    const statusPath = path_1.default.join(ARTIFACTS_DIR, `${jobId}.json`);
    fs_1.default.writeFileSync(statusPath, JSON.stringify(payload, null, 2), { encoding: "utf-8" });
}
/**
 * Read job status from disk
 */
function readStatus(jobId) {
    const statusPath = path_1.default.join(ARTIFACTS_DIR, `${jobId}.json`);
    if (fs_1.default.existsSync(statusPath)) {
        try {
            const content = fs_1.default.readFileSync(statusPath, "utf-8");
            return JSON.parse(content);
        }
        catch (e) {
            return null;
        }
    }
    return null;
}
/**
 * @swagger
 * /api/training:
 *   post:
 *     summary: Create a new training job
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataset:
 *                 type: string
 *                 description: Path to dataset file
 *                 example: data/datasets/1234567890-sample.csv
 *               epochs:
 *                 type: integer
 *                 minimum: 1
 *                 default: 3
 *                 example: 10
 *               batch_size:
 *                 type: integer
 *                 minimum: 1
 *                 default: 16
 *                 example: 32
 *               lr:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 default: 0.01
 *                 example: 0.001
 *     responses:
 *       200:
 *         description: Training job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 job_id:
 *                   type: string
 *                   example: job_1699999999_a1b2c3d4
 *                 pid:
 *                   type: number
 *                 status:
 *                   type: string
 *                   example: QUEUED
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", auth_1.authenticateToken, express_1.default.json(), (req, res) => {
    try {
        const params = req.body || {};
        const jobId = `job_${Date.now()}_${(0, crypto_1.randomBytes)(4).toString("hex")}`;
        const dataset = params.dataset || params.dataset_path || null;
        const epochs = params.epochs || 3;
        const batch_size = params.batch_size || 16;
        const lr = params.lr || 0.01;
        // Python script path (go up one level from BACKEND to root)
        let scriptPath = path_1.default.join(process.cwd(), "..", "scripts", "train_minimal_job.py");
        // Fallback to simulation if PyTorch version doesn't exist
        if (!fs_1.default.existsSync(scriptPath)) {
            scriptPath = path_1.default.join(process.cwd(), "..", "scripts", "train_simulation_fallback.py");
        }
        // Check if script exists
        if (!fs_1.default.existsSync(scriptPath)) {
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
        const child = (0, child_process_1.spawn)(pythonCmd, args, {
            detached: true,
            stdio: ["ignore", "ignore", "ignore"]
        });
        // Detach so process continues independently
        child.unref();
        // Track the process
        ACTIVE_JOBS[jobId] = {
            pid: child.pid,
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
    }
    catch (err) {
        res.status(500).json({
            ok: false,
            error: String(err.message || err)
        });
    }
});
/**
 * @swagger
 * /api/training/status:
 *   get:
 *     summary: Get training job status
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: job_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to query
 *         example: job_1699999999_a1b2c3d4
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   $ref: '#/components/schemas/JobStatus'
 *       400:
 *         description: Missing job_id parameter
 *       404:
 *         description: Job not found
 */
router.get("/status", auth_1.authenticateToken, (req, res) => {
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
 * @swagger
 * /api/training/{jobId}/stop:
 *   post:
 *     summary: Stop a running training job
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to stop
 *         example: job_1699999999_a1b2c3d4
 *     responses:
 *       200:
 *         description: Job stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 job_id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: STOPPED
 *                 message:
 *                   type: string
 *       404:
 *         description: Job not found or not running
 */
router.post("/:jobId/stop", auth_1.authenticateToken, express_1.default.json(), (req, res) => {
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
    }
    catch (err) {
        return res.status(500).json({
            ok: false,
            error: `Failed to stop job: ${err.message || err}`
        });
    }
});
/**
 * @swagger
 * /api/training/jobs:
 *   get:
 *     summary: List all training jobs
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all training jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JobStatus'
 *                 count:
 *                   type: number
 */
router.get("/jobs", auth_1.authenticateToken, (req, res) => {
    try {
        const files = fs_1.default.readdirSync(ARTIFACTS_DIR);
        const jobs = files
            .filter(f => f.endsWith(".json"))
            .map(f => {
            try {
                const content = fs_1.default.readFileSync(path_1.default.join(ARTIFACTS_DIR, f), "utf-8");
                return JSON.parse(content);
            }
            catch (e) {
                return null;
            }
        })
            .filter(j => j !== null);
        res.json({
            ok: true,
            jobs: jobs,
            count: jobs.length
        });
    }
    catch (err) {
        res.status(500).json({
            ok: false,
            error: String(err.message || err)
        });
    }
});
/**
 * @swagger
 * /api/training/{jobId}/download:
 *   get:
 *     summary: Download trained model
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID of completed training
 *         example: job_1699999999_a1b2c3d4
 *     responses:
 *       200:
 *         description: Model file download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Job not completed yet
 *       404:
 *         description: Job or model file not found
 */
router.get("/:jobId/download", auth_1.authenticateToken, (req, res) => {
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
    const modelPath = path_1.default.join(MODELS_DIR, `${jobId}.pt`);
    if (!fs_1.default.existsSync(modelPath)) {
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
/**
 * POST /api/training/internal/status-update
 * Internal endpoint for Python training script to push status updates
 * This endpoint is NOT authenticated as it's called by the training script
 */
router.post("/internal/status-update", express_1.default.json(), (req, res) => {
    try {
        const { job_id, status } = req.body;
        if (!job_id || !status) {
            return res.status(400).json({
                ok: false,
                error: "job_id and status are required"
            });
        }
        // Emit to WebSocket clients
        (0, websocket_service_1.emitJobUpdate)(job_id, status);
        return res.json({ ok: true });
    }
    catch (error) {
        return res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=training.js.map