"use strict";
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
// In-memory job storage (in production, use Redis or database)
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
function parseHFProgress(line, job) {
    // Parse huggingface-cli output for progress
    // Example formats:
    // "Fetching 5 files: 100%|████████| 5/5 [00:01<00:00]"
    // "model.safetensors: 45%|███▌     | 450MB/1GB [00:30<00:37, 15.0MB/s]"
    // File completion
    const fileMatch = line.match(/Fetching (\d+) files:.*?(\d+)\/(\d+)/);
    if (fileMatch) {
        const completed = parseInt(fileMatch[2]);
        const total = parseInt(fileMatch[3]);
        job.progress = Math.round((completed / total) * 100);
        return;
    }
    // Download progress with bytes
    const progressMatch = line.match(/(\d+(?:\.\d+)?)(MB|GB)\/(\d+(?:\.\d+)?)(MB|GB).*?\[.*?<.*?,\s*([\d.]+)(MB|GB)\/s\]/);
    if (progressMatch) {
        const downloaded = parseFloat(progressMatch[1]);
        const downloadedUnit = progressMatch[2];
        const total = parseFloat(progressMatch[3]);
        const totalUnit = progressMatch[4];
        const speed = parseFloat(progressMatch[5]);
        const speedUnit = progressMatch[6];
        // Convert to bytes
        const bytesDownloaded = downloadedUnit === 'GB' ? downloaded * 1024 * 1024 * 1024 : downloaded * 1024 * 1024;
        const bytesTotal = totalUnit === 'GB' ? total * 1024 * 1024 * 1024 : total * 1024 * 1024;
        const bytesSpeed = speedUnit === 'GB' ? speed * 1024 * 1024 * 1024 : speed * 1024 * 1024;
        job.bytesDownloaded = bytesDownloaded;
        job.bytesTotal = bytesTotal;
        job.speed = bytesSpeed;
        job.progress = Math.round((bytesDownloaded / bytesTotal) * 100);
        job.eta = bytesSpeed > 0 ? Math.round((bytesTotal - bytesDownloaded) / bytesSpeed) : undefined;
    }
    // Current file being downloaded
    const fileNameMatch = line.match(/^([\w\-./]+\.\w+):/);
    if (fileNameMatch) {
        job.currentFile = fileNameMatch[1];
    }
}
/**
 * Download a file directly via HTTP/HTTPS
 */
async function downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https_1.default : http_1.default;
        const request = client.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    logger_1.logger.info({ msg: 'Following redirect', from: url, to: redirectUrl });
                    downloadFile(redirectUrl, destPath, onProgress).then(resolve).catch(reject);
                    return;
                }
            }
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
            let downloadedBytes = 0;
            const fileStream = fs_1.default.createWriteStream(destPath);
            response.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                if (onProgress && totalBytes > 0) {
                    onProgress(downloadedBytes, totalBytes);
                }
            });
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
            fileStream.on('error', (err) => {
                fs_1.default.unlink(destPath, () => { }); // Clean up partial file
                reject(err);
            });
        });
        request.on('error', (err) => {
            reject(err);
        });
        request.setTimeout(300000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}
/**
 * Download multiple files directly (for models with direct download URLs)
 */
async function downloadMultipleFiles(urls, destDir, job) {
    ensureDir(destDir);
    const totalFiles = urls.length;
    let completedFiles = 0;
    let totalBytesAll = 0;
    let downloadedBytesAll = 0;
    for (const url of urls) {
        const filename = url.split('/').pop() || 'file';
        const destPath = path_1.default.join(destDir, filename);
        job.currentFile = filename;
        logger_1.logger.info({ msg: 'Downloading file', url, destPath });
        try {
            await downloadFile(url, destPath, (downloaded, total) => {
                // Update progress for this file
                if (totalBytesAll === 0 && total > 0) {
                    // First time we know the size
                    totalBytesAll = total * totalFiles; // Rough estimate
                }
                downloadedBytesAll = (completedFiles * (total || 0)) + downloaded;
                job.bytesDownloaded = downloadedBytesAll;
                job.bytesTotal = totalBytesAll;
                job.progress = Math.round((downloadedBytesAll / totalBytesAll) * 100);
                if (total > 0) {
                    const speed = downloaded / ((Date.now() - new Date(job.startedAt).getTime()) / 1000);
                    job.speed = speed;
                    job.eta = (totalBytesAll - downloadedBytesAll) / speed;
                }
            });
            completedFiles++;
            job.completedFiles.push(filename);
            job.progress = Math.round((completedFiles / totalFiles) * 100);
            logger_1.logger.info({ msg: 'File downloaded', filename, progress: job.progress });
        }
        catch (err) {
            throw new Error(`Failed to download ${filename}: ${err.message}`);
        }
    }
    job.progress = 100;
}
async function startDownload(kind, repoId, repoType, dest, directUrls) {
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
    // Ensure destination directory exists
    ensureDir(dest);
    // Log directory for this job
    const logDir = path_1.default.join('logs', 'downloads');
    ensureDir(logDir);
    const logFile = path_1.default.join(logDir, `${jobId}.json`);
    // Write initial job state
    fs_1.default.writeFileSync(logFile, JSON.stringify(job, null, 2));
    // ✅ NEW: Use direct download if URLs are provided
    if (directUrls && directUrls.length > 0) {
        logger_1.logger.info({ msg: 'Starting direct download', jobId, repoId, urls: directUrls.length, dest });
        job.status = 'downloading';
        // Download files asynchronously
        (async () => {
            try {
                await downloadMultipleFiles(directUrls, dest, job);
                job.status = 'completed';
                job.progress = 100;
                job.finishedAt = new Date().toISOString();
                logger_1.logger.info({ msg: 'Direct download completed', jobId, repoId });
                // Notify download completed
                notifications_1.notificationService.notifyDownloadCompleted(repoId.split('/').pop() || repoId);
                // Final update to log file
                fs_1.default.writeFileSync(logFile, JSON.stringify(job, null, 2));
            }
            catch (err) {
                job.status = 'error';
                job.error = err.message;
                job.finishedAt = new Date().toISOString();
                logger_1.logger.error({ msg: 'Direct download failed', jobId, repoId, error: err.message });
                // Notify download error
                notifications_1.notificationService.notifyDownloadError(repoId.split('/').pop() || repoId, err.message);
                fs_1.default.writeFileSync(logFile, JSON.stringify(job, null, 2));
            }
        })();
        return job;
    }
    // ✅ FALLBACK: Use huggingface-cli for full repo download
    const args = [
        'snapshot-download',
        '--repo-type', repoType,
        repoId,
        '--local-dir', dest,
        '--local-dir-use-symlinks', 'False'
    ];
    logger_1.logger.info({ msg: 'Starting download with HF CLI', jobId, repoId, repoType, dest });
    const proc = (0, child_process_1.spawn)('huggingface-cli', args);
    jobProcesses.set(jobId, proc);
    job.status = 'downloading';
    proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                parseHFProgress(line, job);
                logger_1.logger.debug({ msg: 'Download progress', jobId, line: line.trim() });
            }
        }
        // Update log file
        fs_1.default.writeFileSync(logFile, JSON.stringify(job, null, 2));
    });
    proc.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                parseHFProgress(line, job);
                logger_1.logger.debug({ msg: 'Download stderr', jobId, line: line.trim() });
            }
        }
    });
    proc.on('close', (code) => {
        jobProcesses.delete(jobId);
        if (code === 0) {
            job.status = 'completed';
            job.progress = 100;
            job.finishedAt = new Date().toISOString();
            logger_1.logger.info({ msg: 'Download completed', jobId, repoId });
            // Notify download completed
            notifications_1.notificationService.notifyDownloadCompleted(repoId.split('/').pop() || repoId);
        }
        else {
            job.status = 'error';
            job.error = `Process exited with code ${code}`;
            job.finishedAt = new Date().toISOString();
            logger_1.logger.error({ msg: 'Download failed', jobId, repoId, code });
            // Notify download error
            notifications_1.notificationService.notifyDownloadError(repoId.split('/').pop() || repoId, `Process exited with code ${code}`);
        }
        // Final update to log file
        fs_1.default.writeFileSync(logFile, JSON.stringify(job, null, 2));
    });
    proc.on('error', (err) => {
        job.status = 'error';
        job.error = err.message;
        job.finishedAt = new Date().toISOString();
        logger_1.logger.error({ msg: 'Download process error', jobId, error: err.message });
        // Notify download error
        notifications_1.notificationService.notifyDownloadError(repoId.split('/').pop() || repoId, err.message);
        fs_1.default.writeFileSync(logFile, JSON.stringify(job, null, 2));
    });
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