"use strict";
// BACKEND/src/services/downloads.ts - FIXED VERSION
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDownload = startDownload;
exports.getDownloadJob = getDownloadJob;
exports.getAllDownloadJobs = getAllDownloadJobs;
exports.cancelDownload = cancelDownload;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const logger_1 = require("../middleware/logger");
const notifications_1 = require("./notifications");
const modelCatalog_1 = require("../config/modelCatalog");
// In-memory job storage
const jobs = new Map();
const jobProcesses = new Map();
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
function generateJobId() {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Download a single file with progress tracking
 */
async function downloadFile(url, destination, onProgress, token) {
    return new Promise((resolve, reject) => {
        const file = fs_1.default.createWriteStream(destination);
        const client = url.startsWith('https') ? https_1.default : http_1.default;
        // Prepare request options with optional token
        const options = { headers: {} };
        if (token && url.includes('huggingface.co')) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        const request = client.get(url, options, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirects
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    file.close();
                    fs_1.default.unlinkSync(destination);
                    return downloadFile(redirectUrl, destination, onProgress, token)
                        .then(resolve)
                        .catch(reject);
                }
            }
            if (response.statusCode !== 200) {
                file.close();
                fs_1.default.unlinkSync(destination);
                return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            }
            const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
            let downloadedBytes = 0;
            response.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                if (onProgress && totalBytes > 0) {
                    onProgress(downloadedBytes, totalBytes);
                }
            });
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
            file.on('error', (err) => {
                file.close();
                fs_1.default.unlinkSync(destination);
                reject(err);
            });
        });
        request.on('error', (err) => {
            file.close();
            try {
                fs_1.default.unlinkSync(destination);
            }
            catch (e) {
                // Ignore
            }
            reject(err);
        });
        request.setTimeout(30000); // 30 second timeout
    });
}
/**
 * Download model using direct URLs from catalog
 */
async function downloadModelDirect(jobId, modelId, destination, token) {
    const job = jobs.get(jobId);
    if (!job) {
        throw new Error('Job not found');
    }
    // Get model info from catalog
    const model = (0, modelCatalog_1.getModelById)(modelId);
    if (!model) {
        throw new Error(`Model not found in catalog: ${modelId}`);
    }
    // Get all download URLs
    const urls = (0, modelCatalog_1.getAllDownloadUrls)(modelId);
    if (urls.length === 0) {
        throw new Error(`No download URLs found for model: ${modelId}`);
    }
    logger_1.logger.info({
        msg: 'Starting direct download',
        jobId,
        modelId,
        fileCount: urls.length
    });
    // Create destination directory
    ensureDir(destination);
    job.status = 'downloading';
    job.progress = 0;
    // Download all files
    let completedFiles = 0;
    const totalFiles = urls.length;
    for (const url of urls) {
        const filename = (0, modelCatalog_1.getFilenameFromUrl)(url);
        const filepath = path_1.default.join(destination, filename);
        job.currentFile = filename;
        logger_1.logger.info({ msg: 'Downloading file', jobId, filename, url });
        try {
            await downloadFile(url, filepath, (downloaded, total) => {
                // Calculate overall progress
                const fileProgress = (downloaded / total) * 100;
                const overallProgress = ((completedFiles / totalFiles) * 100) +
                    (fileProgress / totalFiles);
                job.progress = Math.round(overallProgress);
                job.bytesDownloaded = downloaded;
                job.bytesTotal = total;
                // Update job
                jobs.set(jobId, job);
            }, token);
            job.completedFiles.push(filename);
            completedFiles++;
            logger_1.logger.info({ msg: 'File downloaded', jobId, filename });
        }
        catch (error) {
            logger_1.logger.error({ msg: 'File download failed', jobId, filename, error: error.message });
            throw new Error(`Failed to download ${filename}: ${error.message}`);
        }
    }
    // Mark as completed
    job.status = 'completed';
    job.progress = 100;
    job.finishedAt = new Date().toISOString();
    jobs.set(jobId, job);
    logger_1.logger.info({ msg: 'Download completed', jobId, modelId });
}
/**
 * Download using git clone (fallback method)
 */
async function downloadWithGit(jobId, modelId, _repoType, destination, token) {
    return new Promise((resolve, reject) => {
        const job = jobs.get(jobId);
        if (!job) {
            reject(new Error('Job not found'));
            return;
        }
        ensureDir(destination);
        const gitUrl = `https://huggingface.co/${modelId}`;
        const gitProcess = (0, child_process_1.spawn)('git', ['clone', '--progress', gitUrl, destination], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        jobProcesses.set(jobId, gitProcess);
        job.status = 'downloading';
        job.progress = 5;
        let progressRegex = /(\d+)%/;
        gitProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            const lines = output.split('\n');
            for (const line of lines) {
                const match = line.match(progressRegex);
                if (match) {
                    job.progress = Math.min(95, parseInt(match[1]));
                    jobs.set(jobId, job);
                }
            }
        });
        gitProcess.stderr?.on('data', (data) => {
            const errorData = data.toString();
            logger_1.logger.debug(`Git: ${errorData}`);
            const progressMatch = errorData.match(progressRegex);
            if (progressMatch) {
                job.progress = Math.min(95, parseInt(progressMatch[1]));
                jobs.set(jobId, job);
            }
            if (errorData.includes('fatal:') || errorData.includes('error:')) {
                job.error = errorData;
                job.status = 'error';
                jobs.set(jobId, job);
            }
        });
        gitProcess.on('close', (code) => {
            jobProcesses.delete(jobId);
            if (code === 0) {
                job.status = 'completed';
                job.progress = 100;
                job.finishedAt = new Date().toISOString();
                jobs.set(jobId, job);
                logger_1.logger.info(`Git clone completed: ${modelId}`);
                resolve();
            }
            else {
                job.status = 'error';
                job.error = `Git clone failed with code ${code}`;
                jobs.set(jobId, job);
                reject(new Error(`Download failed with code ${code}`));
            }
        });
        gitProcess.on('error', (error) => {
            jobProcesses.delete(jobId);
            job.status = 'error';
            job.error = `Git process error: ${error.message}`;
            jobs.set(jobId, job);
            reject(error);
        });
    });
}
/**
 * Start a new download job
 */
async function startDownload(kind, repoId, repoType, dest, token) {
    const jobId = generateJobId();
    const job = {
        id: jobId,
        kind,
        repoId,
        repoType,
        dest,
        status: 'pending',
        progress: 0,
        completedFiles: [],
        startedAt: new Date().toISOString(),
    };
    jobs.set(jobId, job);
    ensureDir(dest);
    // Log directory
    const logDir = path_1.default.join('logs', 'downloads');
    ensureDir(logDir);
    const logFile = path_1.default.join(logDir, `${jobId}.json`);
    fs_1.default.writeFileSync(logFile, JSON.stringify(job, null, 2));
    logger_1.logger.info({ msg: 'Starting download', jobId, repoId, repoType, dest });
    // Start download process (async)
    (async () => {
        try {
            // Try direct download first (from catalog)
            const model = (0, modelCatalog_1.getModelById)(repoId);
            if (model && model.downloadUrls) {
                await downloadModelDirect(jobId, repoId, dest);
            }
            else {
                // Fallback to git clone
                logger_1.logger.info({ msg: 'Using git clone fallback', jobId, repoId });
                await downloadWithGit(jobId, repoId, repoType, dest);
            }
            notifications_1.notificationService.notifyDownloadCompleted(repoId.split('/').pop() || repoId);
        }
        catch (error) {
            const job = jobs.get(jobId);
            if (job) {
                job.status = 'error';
                job.error = error.message;
                job.finishedAt = new Date().toISOString();
                jobs.set(jobId, job);
            }
            logger_1.logger.error({ msg: 'Download failed', jobId, repoId, error: error.message });
            notifications_1.notificationService.notifyDownloadError(repoId.split('/').pop() || repoId, error.message);
        }
        // Update log file
        const job = jobs.get(jobId);
        if (job) {
            fs_1.default.writeFileSync(logFile, JSON.stringify(job, null, 2));
        }
    })();
    return job;
}
function getDownloadJob(jobId) {
    return jobs.get(jobId) || null;
}
function getAllDownloadJobs() {
    return Array.from(jobs.values());
}
function cancelDownload(jobId) {
    const proc = jobProcesses.get(jobId);
    const job = jobs.get(jobId);
    if (proc && job) {
        proc.kill();
        job.status = 'error';
        job.error = 'Cancelled by user';
        job.finishedAt = new Date().toISOString();
        return true;
    }
    return false;
}
//# sourceMappingURL=downloads.js.map