"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const logger_1 = require("../utils/logger");
const logBuffer = [];
const MAX_LOG_ENTRIES = 1000;
const pushLog = (level, message, jobId) => {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        jobId
    };
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOG_ENTRIES) {
        logBuffer.shift();
    }
    // همچنین در logger اصلی لاگ کنید
    try {
        logger_1.logger[level]?.(jobId ? `[${jobId}] ${message}` : message);
    }
    catch (error) {
        // ignore logger errors
    }
};
exports.router = express_1.default.Router();
// ذخیره jobs در memory
const jobs = new Map();
// utility functions
const ensureDirectory = (filePath) => {
    const dir = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
};
// اصلاح شده: حذف پارامتر url که استفاده نمی‌شد
const generateJobId = () => {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
const simulateDownload = (job) => {
    job.status = 'running';
    job.startedAt = Date.now();
    // شبیه‌سازی دانلود برای URLهای غیر-HTTP
    const totalBytes = 5 * 1024 * 1024; // 5 MB
    job.bytesTotal = totalBytes;
    job.bytesReceived = 0;
    const chunkSize = Math.max(50 * 1024, Math.floor(totalBytes / 40));
    const interval = setInterval(() => {
        if (job.status !== 'running') {
            clearInterval(interval);
            return;
        }
        job.bytesReceived = Math.min(totalBytes, job.bytesReceived + chunkSize);
        if (job.bytesReceived >= totalBytes) {
            clearInterval(interval);
            job.status = 'completed';
            job.completedAt = Date.now();
            // ایجاد فایل شبیه‌سازی شده
            try {
                ensureDirectory(job.dest);
                fs_1.default.writeFileSync(job.dest, `Simulated download completed at ${new Date().toISOString()}\nURL: ${job.url}\nJobID: ${job.id}`);
                pushLog('info', `Simulated download completed successfully`, job.id);
            }
            catch (error) {
                const errorMessage = `Failed to write simulated file: ${error}`;
                pushLog('error', errorMessage, job.id);
                job.status = 'error';
                job.error = errorMessage;
            }
        }
    }, 250);
    pushLog('info', `Started simulated download`, job.id);
};
const startHttpDownload = (job) => {
    job.status = 'running';
    job.startedAt = Date.now();
    ensureDirectory(job.dest);
    const file = fs_1.default.createWriteStream(job.dest);
    const client = job.url.startsWith('https') ? https_1.default : http_1.default;
    const request = client.get(job.url, (response) => {
        if (response.statusCode && response.statusCode >= 400) {
            const errorMessage = `HTTP Error ${response.statusCode}`;
            pushLog('error', errorMessage, job.id);
            job.status = 'error';
            job.error = errorMessage;
            file.close();
            try {
                if (fs_1.default.existsSync(job.dest)) {
                    fs_1.default.unlinkSync(job.dest);
                }
            }
            catch (unlinkError) {
                // ignore unlink errors
            }
            return;
        }
        const contentLength = response.headers['content-length'];
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
        job.bytesTotal = Number.isFinite(totalBytes) && totalBytes > 0 ? totalBytes : undefined;
        response.on('data', (chunk) => {
            job.bytesReceived += chunk.length;
        });
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            job.status = 'completed';
            job.completedAt = Date.now();
            pushLog('info', `Download completed successfully`, job.id);
        });
    });
    request.on('error', (error) => {
        const errorMessage = `Network error: ${error.message}`;
        pushLog('error', errorMessage, job.id);
        job.status = 'error';
        job.error = errorMessage;
        try {
            file.close();
        }
        catch (closeError) {
            // ignore close errors
        }
        try {
            if (fs_1.default.existsSync(job.dest)) {
                fs_1.default.unlinkSync(job.dest);
            }
        }
        catch (unlinkError) {
            // ignore unlink errors
        }
    });
    request.on('timeout', () => {
        const errorMessage = 'Request timeout';
        pushLog('error', errorMessage, job.id);
        job.status = 'error';
        job.error = errorMessage;
        request.destroy();
    });
    request.setTimeout(30000); // 30 second timeout
    pushLog('info', `Started HTTP download from ${job.url}`, job.id);
};
const startDownload = (job) => {
    // بررسی آیا URL معتبر HTTP/HTTPS است
    const isHttpUrl = /^https?:\/\//i.test(job.url);
    if (isHttpUrl) {
        startHttpDownload(job);
    }
    else {
        simulateDownload(job);
    }
};
// ===== ROUTES =====
// شروع دانلود جدید - POST /api/download
exports.router.post('/', async (req, res) => {
    try {
        const { url, dest, kind = 'generic' } = req.body;
        // اعتبارسنجی
        if (!url || !dest) {
            return res.status(400).json({
                ok: false,
                error: 'Missing required fields: url and dest are required'
            });
        }
        if (typeof url !== 'string' || typeof dest !== 'string') {
            return res.status(400).json({
                ok: false,
                error: 'Invalid field types: url and dest must be strings'
            });
        }
        // ایجاد job جدید
        const jobId = generateJobId();
        const job = {
            id: jobId,
            url: String(url),
            dest: String(dest),
            kind: kind,
            bytesReceived: 0,
            status: 'pending',
            createdAt: Date.now()
        };
        jobs.set(jobId, job);
        // شروع دانلود (غیرهمزمان)
        setTimeout(() => startDownload(job), 0);
        pushLog('info', `Download job created`, jobId);
        return res.status(201).json({
            ok: true,
            id: jobId,
            message: 'Download job started successfully'
        });
    }
    catch (error) {
        const errorMessage = `Failed to create download job: ${error}`;
        pushLog('error', errorMessage);
        return res.status(500).json({
            ok: false,
            error: errorMessage
        });
    }
});
// دریافت وضعیت دانلود - GET /api/download/status
exports.router.get('/status', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                ok: false,
                error: 'Job ID is required'
            });
        }
        const job = jobs.get(id);
        if (!job) {
            return res.status(404).json({
                ok: false,
                error: 'Job not found'
            });
        }
        // محاسبه پیشرفت
        let progress = null;
        if (job.bytesTotal && job.bytesTotal > 0) {
            progress = Math.min(100, Math.round((job.bytesReceived / job.bytesTotal) * 100));
        }
        // محاسبه زمان تخمینی باقی‌مانده
        let eta = null;
        if (job.status === 'running' && job.startedAt && job.bytesTotal && job.bytesReceived > 0) {
            const elapsed = Date.now() - job.startedAt;
            const bytesPerMs = job.bytesReceived / elapsed;
            const remainingBytes = job.bytesTotal - job.bytesReceived;
            eta = Math.round(remainingBytes / bytesPerMs / 1000); // به ثانیه
        }
        const response = {
            ok: true,
            job: {
                id: job.id,
                url: job.url,
                dest: job.dest,
                kind: job.kind,
                status: job.status,
                bytesReceived: job.bytesReceived,
                bytesTotal: job.bytesTotal,
                progress,
                eta,
                error: job.error,
                createdAt: job.createdAt,
                startedAt: job.startedAt,
                completedAt: job.completedAt
            }
        };
        return res.json(response);
    }
    catch (error) {
        const errorMessage = `Failed to get job status: ${error}`;
        pushLog('error', errorMessage);
        return res.status(500).json({
            ok: false,
            error: errorMessage
        });
    }
});
// لیست همه jobs - GET /api/download/jobs
// اصلاح شده: استفاده از _req برای پارامتر استفاده نشده
exports.router.get('/jobs', async (_req, res) => {
    try {
        const allJobs = Array.from(jobs.values()).map(job => ({
            id: job.id,
            url: job.url,
            dest: job.dest,
            kind: job.kind,
            status: job.status,
            bytesReceived: job.bytesReceived,
            bytesTotal: job.bytesTotal,
            progress: job.bytesTotal && job.bytesTotal > 0 ?
                Math.min(100, Math.round((job.bytesReceived / job.bytesTotal) * 100)) : null,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt
        }));
        return res.json({
            ok: true,
            jobs: allJobs,
            total: allJobs.length
        });
    }
    catch (error) {
        const errorMessage = `Failed to list jobs: ${error}`;
        pushLog('error', errorMessage);
        return res.status(500).json({
            ok: false,
            error: errorMessage
        });
    }
});
// دریافت لاگ‌ها - GET /api/download/logs
exports.router.get('/logs', async (req, res) => {
    try {
        const { limit = '100', jobId } = req.query;
        let filteredLogs = logBuffer;
        // فیلتر بر اساس jobId اگر ارائه شده باشد
        if (jobId && typeof jobId === 'string') {
            filteredLogs = logBuffer.filter(entry => entry.jobId === jobId);
        }
        // محدود کردن تعداد لاگ‌ها
        const logLimit = Math.min(parseInt(limit, 10) || 100, 1000);
        const limitedLogs = filteredLogs.slice(-logLimit);
        return res.json({
            ok: true,
            logs: limitedLogs,
            total: limitedLogs.length
        });
    }
    catch (error) {
        const errorMessage = `Failed to get logs: ${error}`;
        pushLog('error', errorMessage);
        return res.status(500).json({
            ok: false,
            error: errorMessage
        });
    }
});
// حذف job - DELETE /api/download/job
exports.router.delete('/job', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                ok: false,
                error: 'Job ID is required'
            });
        }
        const deleted = jobs.delete(id);
        if (!deleted) {
            return res.status(404).json({
                ok: false,
                error: 'Job not found'
            });
        }
        pushLog('info', `Job deleted`, id);
        return res.json({
            ok: true,
            message: 'Job deleted successfully'
        });
    }
    catch (error) {
        const errorMessage = `Failed to delete job: ${error}`;
        pushLog('error', errorMessage);
        return res.status(500).json({
            ok: false,
            error: errorMessage
        });
    }
});
// سلامت سرویس - GET /api/download/health
// اصلاح شده: استفاده از _req برای پارامتر استفاده نشده
exports.router.get('/health', async (_req, res) => {
    try {
        const activeJobs = Array.from(jobs.values()).filter(job => job.status === 'running' || job.status === 'pending').length;
        return res.json({
            ok: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            activeJobs,
            totalJobs: jobs.size,
            logEntries: logBuffer.length
        });
    }
    catch (error) {
        const errorMessage = `Health check failed: ${error}`;
        pushLog('error', errorMessage);
        return res.status(500).json({
            ok: false,
            status: 'unhealthy',
            error: errorMessage
        });
    }
});
exports.default = exports.router;
//# sourceMappingURL=bootstrap.js.map