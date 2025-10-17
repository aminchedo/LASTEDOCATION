"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicHealthCheck = basicHealthCheck;
exports.detailedHealthCheck = detailedHealthCheck;
const os_1 = __importDefault(require("os"));
const logger_1 = require("../config/logger");
/**
 * Basic health check endpoint
 */
function basicHealthCheck(req, res) {
    res.json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
}
/**
 * Detailed health check with system metrics
 */
async function detailedHealthCheck(req, res) {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks: {
                memory: checkMemory(),
                disk: checkDisk(),
                api: checkAPI(),
            },
        };
        // Determine overall status
        const checks = Object.values(health.checks);
        if (checks.some(check => check?.status === 'fail')) {
            health.status = 'unhealthy';
        }
        else if (checks.some(check => check?.status === 'warn')) {
            health.status = 'degraded';
        }
        const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(health);
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
}
/**
 * Check memory usage
 */
function checkMemory() {
    const used = process.memoryUsage();
    const totalMem = os_1.default.totalmem();
    const freeMem = os_1.default.freemem();
    const usedPercentage = ((totalMem - freeMem) / totalMem) * 100;
    let status = 'pass';
    let message = 'Memory usage normal';
    if (usedPercentage > 90) {
        status = 'fail';
        message = 'Critical memory usage';
    }
    else if (usedPercentage > 75) {
        status = 'warn';
        message = 'High memory usage';
    }
    return {
        status,
        message,
        value: {
            heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
            external: Math.round(used.external / 1024 / 1024) + 'MB',
            systemUsage: usedPercentage.toFixed(2) + '%',
        },
    };
}
/**
 * Check disk usage
 */
function checkDisk() {
    // Note: This is a simplified check. In production, use a library like 'diskusage'
    return {
        status: 'pass',
        message: 'Disk usage normal',
        value: {
            // Placeholder - implement actual disk check if needed
            note: 'Disk monitoring not implemented',
        },
    };
}
/**
 * Check API responsiveness
 */
function checkAPI() {
    const uptime = process.uptime();
    let status = 'pass';
    let message = 'API responsive';
    if (uptime < 60) {
        status = 'warn';
        message = 'Recently started';
    }
    return {
        status,
        message,
        value: {
            uptime: Math.round(uptime) + 's',
            nodeVersion: process.version,
            platform: process.platform,
        },
    };
}
exports.default = {
    basicHealthCheck,
    detailedHealthCheck,
};
//# sourceMappingURL=health.js.map