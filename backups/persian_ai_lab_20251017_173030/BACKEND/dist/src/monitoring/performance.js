"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformanceMetrics = getPerformanceMetrics;
exports.trackResponseTime = trackResponseTime;
exports.getPerformanceSummary = getPerformanceSummary;
const os_1 = __importDefault(require("os"));
const perf_hooks_1 = require("perf_hooks");
// Store performance history
const performanceHistory = [];
const MAX_HISTORY = 100;
/**
 * Get performance metrics
 */
function getPerformanceMetrics(req, res) {
    const metrics = {
        timestamp: new Date().toISOString(),
        process: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
        },
        system: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            loadAverage: os_1.default.loadavg(),
            freeMemory: formatBytes(os_1.default.freemem()),
            totalMemory: formatBytes(os_1.default.totalmem()),
            cpuCount: os_1.default.cpus().length,
        },
        performance: {
            eventLoopLag: measureEventLoopLag(),
            responseTime: calculateAverageResponseTime(),
        },
    };
    res.json({
        status: 'success',
        data: metrics,
    });
}
/**
 * Track response time
 */
function trackResponseTime(duration) {
    performanceHistory.push({
        timestamp: Date.now(),
        responseTime: duration,
    });
    // Keep only last MAX_HISTORY entries
    if (performanceHistory.length > MAX_HISTORY) {
        performanceHistory.shift();
    }
}
/**
 * Calculate average response time
 */
function calculateAverageResponseTime() {
    if (performanceHistory.length === 0)
        return undefined;
    const sum = performanceHistory.reduce((acc, entry) => acc + entry.responseTime, 0);
    return Math.round(sum / performanceHistory.length);
}
/**
 * Measure event loop lag
 */
function measureEventLoopLag() {
    const start = perf_hooks_1.performance.now();
    setImmediate(() => {
        const lag = perf_hooks_1.performance.now() - start;
        return lag;
    });
    return 0; // Simplified - implement proper event loop monitoring if needed
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
 * Get performance summary
 */
function getPerformanceSummary() {
    return {
        averageResponseTime: calculateAverageResponseTime(),
        sampleCount: performanceHistory.length,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
    };
}
exports.default = {
    getPerformanceMetrics,
    trackResponseTime,
    getPerformanceSummary,
};
//# sourceMappingURL=performance.js.map