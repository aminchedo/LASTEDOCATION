"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemMetrics = getSystemMetrics;
exports.getDiskUsage = getDiskUsage;
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Get comprehensive system metrics
 */
async function getSystemMetrics(req, res) {
    try {
        const cpus = os_1.default.cpus();
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const usedMem = totalMem - freeMem;
        const metrics = {
            timestamp: new Date().toISOString(),
            cpu: {
                count: cpus.length,
                model: cpus[0]?.model || 'Unknown',
                speed: cpus[0]?.speed || 0,
                usage: await getCPUUsage(),
                loadAverage: os_1.default.loadavg(),
            },
            memory: {
                total: totalMem,
                free: freeMem,
                used: usedMem,
                usagePercent: (usedMem / totalMem) * 100,
                formatted: {
                    total: formatBytes(totalMem),
                    free: formatBytes(freeMem),
                    used: formatBytes(usedMem),
                },
            },
            os: {
                platform: os_1.default.platform(),
                type: os_1.default.type(),
                release: os_1.default.release(),
                arch: os_1.default.arch(),
                hostname: os_1.default.hostname(),
                uptime: os_1.default.uptime(),
            },
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                versions: process.versions,
            },
        };
        res.json({
            status: 'success',
            data: metrics,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get system metrics',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * Get CPU usage percentage
 */
async function getCPUUsage() {
    const cpus = os_1.default.cpus();
    return cpus.map(cpu => {
        const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
        const idle = cpu.times.idle;
        const usage = ((total - idle) / total) * 100;
        return Math.round(usage * 100) / 100;
    });
}
/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0)
        return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}
/**
 * Get disk usage (Linux only)
 */
async function getDiskUsage(req, res) {
    try {
        if (os_1.default.platform() !== 'linux') {
            res.json({
                status: 'success',
                message: 'Disk usage only available on Linux',
                data: null,
            });
            return;
        }
        const { stdout } = await execAsync('df -h /');
        const lines = stdout.trim().split('\n');
        const data = lines[1].split(/\s+/);
        res.json({
            status: 'success',
            data: {
                filesystem: data[0],
                size: data[1],
                used: data[2],
                available: data[3],
                usePercent: data[4],
                mounted: data[5],
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get disk usage',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
exports.default = {
    getSystemMetrics,
    getDiskUsage,
};
//# sourceMappingURL=system.js.map