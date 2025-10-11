"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const downloads_1 = require("../services/downloads");
const modelCatalog_1 = require("../config/modelCatalog");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const router = (0, express_1.Router)();
const activeDownloads = new Map();
async function checkHuggingFaceCLI() {
    try {
        await execAsync('huggingface-cli --version');
        return true;
    }
    catch (error) {
        logger_1.logger.warn('HuggingFace CLI not found, will use git clone method');
        return false;
    }
}
async function downloadModelWithGit(modelId, destination, jobId) {
    return new Promise((resolve, reject) => {
        const job = activeDownloads.get(jobId);
        if (!job) {
            reject(new Error('Job not found'));
            return;
        }
        // Create destination directory
        const fullPath = path_1.default.join(process.cwd(), 'models', destination);
        fs_1.default.mkdirSync(fullPath, { recursive: true });
        // Use git clone to download from HuggingFace
        const gitUrl = `https://huggingface.co/${modelId}`;
        const gitProcess = (0, child_process_1.spawn)('git', ['clone', '--progress', gitUrl, fullPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        job.status = 'downloading';
        job.progress = 5;
        activeDownloads.set(jobId, job);
        let output = '';
        let progressRegex = /(\d+)%/;
        gitProcess.stdout?.on('data', (data) => {
            output += data.toString();
            // Extract progress from git output
            const lines = output.split('\n');
            for (const line of lines) {
                const match = line.match(progressRegex);
                if (match) {
                    job.progress = Math.min(95, parseInt(match[1]));
                    activeDownloads.set(jobId, job);
                }
            }
        });
        gitProcess.stderr?.on('data', (data) => {
            const errorData = data.toString();
            logger_1.logger.info(`Git download info: ${errorData}`);
            // Extract progress from stderr (git sends progress there)
            const progressMatch = errorData.match(progressRegex);
            if (progressMatch) {
                job.progress = Math.min(95, parseInt(progressMatch[1]));
                activeDownloads.set(jobId, job);
            }
            // Check for actual errors
            if (errorData.includes('fatal:') || errorData.includes('error:')) {
                job.error = errorData;
                job.status = 'failed';
                activeDownloads.set(jobId, job);
            }
        });
        gitProcess.on('close', (code) => {
            if (code === 0) {
                job.status = 'completed';
                job.progress = 100;
                job.endTime = Date.now();
                activeDownloads.set(jobId, job);
                logger_1.logger.info(`Model ${modelId} downloaded successfully to ${fullPath}`);
                resolve();
            }
            else {
                job.status = 'failed';
                job.error = `Git clone failed with code ${code}`;
                activeDownloads.set(jobId, job);
                reject(new Error(`Download failed with code ${code}`));
            }
        });
        gitProcess.on('error', (error) => {
            job.status = 'failed';
            job.error = `Git process error: ${error.message}`;
            activeDownloads.set(jobId, job);
            reject(error);
        });
    });
}
async function downloadModelWithCLI(modelId, destination, jobId) {
    return new Promise((resolve, reject) => {
        const job = activeDownloads.get(jobId);
        if (!job) {
            reject(new Error('Job not found'));
            return;
        }
        const fullPath = path_1.default.join(process.cwd(), 'models', destination);
        fs_1.default.mkdirSync(path_1.default.dirname(fullPath), { recursive: true });
        const downloadProcess = (0, child_process_1.spawn)('huggingface-cli', [
            'download',
            modelId,
            '--local-dir',
            fullPath,
            '--repo-type',
            'model'
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        job.status = 'downloading';
        job.progress = 0;
        activeDownloads.set(jobId, job);
        downloadProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            // Parse progress from HuggingFace CLI output
            const progressMatch = output.match(/(\d+)%/);
            if (progressMatch) {
                job.progress = parseInt(progressMatch[1]);
                activeDownloads.set(jobId, job);
            }
        });
        downloadProcess.stderr?.on('data', (data) => {
            logger_1.logger.info(`HF CLI: ${data.toString()}`);
        });
        downloadProcess.on('close', (code) => {
            if (code === 0) {
                job.status = 'completed';
                job.progress = 100;
                job.endTime = Date.now();
                activeDownloads.set(jobId, job);
                resolve();
            }
            else {
                job.status = 'failed';
                job.error = `HuggingFace CLI failed with code ${code}`;
                activeDownloads.set(jobId, job);
                reject(new Error(`Download failed with code ${code}`));
            }
        });
    });
}
// GET /api/sources/downloads - Get download jobs status
router.get('/downloads', async (_req, res) => {
    try {
        const downloads = (0, downloads_1.getAllDownloadJobs)();
        res.json({ success: true, data: downloads });
        return;
    }
    catch (error) {
        const msg = `Error getting downloads: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ success: false, error: msg });
        return;
    }
});
// POST /api/sources/download - Start model download
router.post('/download', async (req, res) => {
    try {
        const { modelId, destination } = req.body;
        if (!modelId) {
            res.status(400).json({ success: false, error: 'modelId is required' });
            return;
        }
        const jobId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const dest = destination || modelId.replace('/', '_');
        // Create download job
        const job = {
            id: jobId,
            modelId,
            status: 'pending',
            progress: 0,
            startTime: Date.now(),
            destination: dest
        };
        activeDownloads.set(jobId, job);
        // Start download asynchronously
        (async () => {
            try {
                const hasHFCLI = await checkHuggingFaceCLI();
                if (hasHFCLI) {
                    await downloadModelWithCLI(modelId, dest, jobId);
                }
                else {
                    await downloadModelWithGit(modelId, dest, jobId);
                }
                logger_1.logger.info(`Download completed for ${modelId}`);
            }
            catch (error) {
                logger_1.logger.error(`Download failed for ${modelId}: ${String(error?.message || error)}`);
                const job = activeDownloads.get(jobId);
                if (job) {
                    job.status = 'failed';
                    job.error = String(error?.message || error);
                    activeDownloads.set(jobId, job);
                }
            }
        })();
        res.json({
            success: true,
            data: {
                jobId,
                modelId,
                message: 'Download started successfully'
            }
        });
        return;
    }
    catch (error) {
        const msg = `Error starting download: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ success: false, error: msg });
        return;
    }
});
// GET /api/sources/download/:jobId - Get download status
router.get('/download/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = (0, downloads_1.getDownloadJob)(jobId);
        if (!job) {
            res.status(404).json({ success: false, error: 'Download job not found' });
            return;
        }
        res.json({ success: true, data: job });
        return;
    }
    catch (error) {
        const msg = `Error getting download status: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ success: false, error: msg });
        return;
    }
});
// DELETE /api/sources/download/:jobId - Cancel download
router.delete('/download/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const success = (0, downloads_1.cancelDownload)(jobId);
        if (!success) {
            res.status(404).json({ success: false, error: 'Download job not found or already completed' });
            return;
        }
        res.json({ success: true, message: 'Download cancelled' });
        return;
    }
    catch (error) {
        const msg = `Error cancelling download: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ success: false, error: msg });
        return;
    }
});
// GET /api/sources/models/available - Get available models
router.get('/models/available', async (_req, res) => {
    try {
        // Return models from catalog
        const models = modelCatalog_1.MODEL_CATALOG.filter(m => m.type === 'model' || m.type === 'tts');
        res.json({ success: true, data: models });
        return;
    }
    catch (error) {
        const msg = `Error getting available models: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ success: false, error: msg });
        return;
    }
});
// GET /api/sources/catalog - Get full model catalog
router.get('/catalog', async (_req, res) => {
    try {
        res.json({ success: true, data: modelCatalog_1.MODEL_CATALOG });
        return;
    }
    catch (error) {
        const msg = `Error getting catalog: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ success: false, error: msg });
        return;
    }
});
// GET /api/sources/catalog/:modelId - Get model from catalog
router.get('/catalog/:modelId', async (req, res) => {
    try {
        const modelId = decodeURIComponent(req.params.modelId);
        const model = (0, modelCatalog_1.getModelById)(modelId);
        if (!model) {
            res.status(404).json({ success: false, error: 'Model not found in catalog' });
            return;
        }
        res.json({ success: true, data: model });
        return;
    }
    catch (error) {
        const msg = `Error getting model from catalog: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ success: false, error: msg });
        return;
    }
});
// POST /api/sources/catalog/download - Download model from catalog
router.post('/catalog/download', async (req, res) => {
    try {
        const { modelId } = req.body;
        if (!modelId) {
            res.status(400).json({ success: false, error: 'modelId is required' });
            return;
        }
        // Get model from catalog
        const model = (0, modelCatalog_1.getModelById)(modelId);
        if (!model) {
            res.status(404).json({ success: false, error: 'Model not found in catalog' });
            return;
        }
        // Get direct download URLs
        const directUrls = (0, modelCatalog_1.getAllDownloadUrls)(modelId);
        const dest = model.defaultDest || `downloads/${modelId.replace('/', '_')}`;
        // Start download with direct URLs if available
        const job = await (0, downloads_1.startDownload)(model.type, modelId, model.repoType, dest, directUrls.length > 0 ? directUrls : undefined);
        res.json({
            success: true,
            data: {
                jobId: job.id,
                modelId,
                message: 'Download started successfully',
                job
            }
        });
        return;
    }
    catch (error) {
        const msg = `Error starting catalog download: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ success: false, error: msg });
        return;
    }
});
// GET /api/sources/datasets/available - Get available datasets
router.get('/datasets/available', async (_req, res) => {
    try {
        // Return datasets from catalog
        const datasets = modelCatalog_1.MODEL_CATALOG.filter(m => m.type === 'dataset');
        res.json({ success: true, data: datasets });
        return;
    }
    catch (error) {
        const msg = `Error getting available datasets: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ success: false, error: msg });
        return;
    }
});
exports.default = router;
// GET /api/sources/installed - Get installed sources
router.get('/installed', async (_req, res) => {
    try {
        const sources = [
            {
                id: 'source_1',
                name: 'Hugging Face',
                type: 'model_repository',
                installed: true,
                version: '2.0.1',
                lastUpdated: new Date().toISOString()
            },
            {
                id: 'source_2',
                name: 'TensorFlow Hub',
                type: 'model_repository',
                installed: true,
                version: '1.3.0',
                lastUpdated: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'source_3',
                name: 'PyTorch Hub',
                type: 'model_repository',
                installed: false,
                version: null,
                lastUpdated: null
            }
        ];
        res.json({ ok: true, sources });
        return;
    }
    catch (error) {
        const msg = `Error getting installed sources: ${String(error?.message || error)}`;
        logger_1.logger.error(msg);
        res.status(500).json({ ok: false, error: msg });
        return;
    }
});
//# sourceMappingURL=sources.js.map