"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Comprehensive Health Check Endpoint
 * Tests all critical system components
 */
const express_1 = require("express");
const connection_1 = require("../database/connection");
const huggingface_service_1 = require("../services/huggingface.service");
const websocket_real_service_1 = require("../services/websocket-real.service");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const router = (0, express_1.Router)();
/**
 * Check database health
 */
async function checkDatabase() {
    const start = Date.now();
    try {
        const isHealthy = await (0, connection_1.healthCheck)();
        const latency = Date.now() - start;
        if (isHealthy) {
            return {
                status: 'healthy',
                message: 'Database connection successful',
                latency,
                details: {
                    connected: true,
                    responseTime: `${latency}ms`
                }
            };
        }
        else {
            return {
                status: 'unhealthy',
                message: 'Database connection failed',
                latency,
                details: {
                    connected: false
                }
            };
        }
    }
    catch (error) {
        return {
            status: 'unhealthy',
            message: 'Database check failed',
            latency: Date.now() - start,
            error: error.message
        };
    }
}
/**
 * Check HuggingFace API health
 */
async function checkHuggingFace() {
    const start = Date.now();
    try {
        // Try to validate a dummy token to check API connectivity
        // If no token or invalid token, API will return 401 but that means it's reachable
        const result = await huggingface_service_1.hfService.validateToken('hf_test');
        const latency = Date.now() - start;
        // If we got a response (even if invalid), API is reachable
        return {
            status: 'healthy',
            message: 'HuggingFace API is reachable',
            latency,
            details: {
                apiUrl: 'https://huggingface.co/api',
                reachable: true,
                responseTime: `${latency}ms`
            }
        };
    }
    catch (error) {
        const latency = Date.now() - start;
        // Check if it's a network error or API error
        if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
            return {
                status: 'unhealthy',
                message: 'Cannot reach HuggingFace API',
                latency,
                error: error.message
            };
        }
        // If we got here, API is reachable but returned an error (which is fine for health check)
        return {
            status: 'healthy',
            message: 'HuggingFace API is reachable',
            latency,
            details: {
                apiUrl: 'https://huggingface.co/api',
                reachable: true
            }
        };
    }
}
/**
 * Check filesystem health
 */
async function checkFilesystem() {
    try {
        const modelsDir = path_1.default.join(process.cwd(), 'models');
        // Ensure directory exists
        if (!fs_1.default.existsSync(modelsDir)) {
            fs_1.default.mkdirSync(modelsDir, { recursive: true });
        }
        // Check if directory is writable
        const testFile = path_1.default.join(modelsDir, '.health_check_test');
        fs_1.default.writeFileSync(testFile, 'test');
        fs_1.default.unlinkSync(testFile);
        // Get disk space info
        const stats = fs_1.default.statfsSync ? fs_1.default.statfsSync(modelsDir) : null;
        let diskSpace = { available: 'unknown' };
        if (stats) {
            const availableBytes = stats.bavail * stats.bsize;
            const totalBytes = stats.blocks * stats.bsize;
            const usedBytes = totalBytes - availableBytes;
            const usedPercent = ((usedBytes / totalBytes) * 100).toFixed(2);
            diskSpace = {
                total: `${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB`,
                available: `${(availableBytes / 1024 / 1024 / 1024).toFixed(2)} GB`,
                used: `${(usedBytes / 1024 / 1024 / 1024).toFixed(2)} GB`,
                usedPercent: `${usedPercent}%`
            };
            // Warn if disk is >90% full
            if (parseFloat(usedPercent) > 90) {
                return {
                    status: 'degraded',
                    message: 'Disk space running low',
                    details: {
                        modelsDirectory: modelsDir,
                        writable: true,
                        diskSpace
                    }
                };
            }
        }
        return {
            status: 'healthy',
            message: 'Filesystem accessible and writable',
            details: {
                modelsDirectory: modelsDir,
                writable: true,
                diskSpace
            }
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            message: 'Filesystem check failed',
            error: error.message
        };
    }
}
/**
 * Check WebSocket server health
 */
function checkWebSocket() {
    try {
        const io = (0, websocket_real_service_1.getWebSocketServer)();
        if (!io) {
            return {
                status: 'degraded',
                message: 'WebSocket server not initialized',
                details: {
                    initialized: false
                }
            };
        }
        // Get connected clients count
        const clientsCount = io.engine.clientsCount;
        return {
            status: 'healthy',
            message: 'WebSocket server running',
            details: {
                initialized: true,
                connectedClients: clientsCount,
                path: '/socket.io'
            }
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            message: 'WebSocket check failed',
            error: error.message
        };
    }
}
/**
 * Check memory health
 */
function checkMemory() {
    try {
        const memUsage = process.memoryUsage();
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const usedMem = totalMem - freeMem;
        const memPercent = ((usedMem / totalMem) * 100).toFixed(2);
        // Convert to MB
        const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
        const externalMB = (memUsage.external / 1024 / 1024).toFixed(2);
        const details = {
            process: {
                heapUsed: `${heapUsedMB} MB`,
                heapTotal: `${heapTotalMB} MB`,
                external: `${externalMB} MB`,
                rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
            },
            system: {
                total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                usedPercent: `${memPercent}%`
            }
        };
        // Warn if system memory is >90% used
        if (parseFloat(memPercent) > 90) {
            return {
                status: 'degraded',
                message: 'High memory usage',
                details
            };
        }
        // Warn if heap is >80% of heap total
        const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        if (heapPercent > 80) {
            return {
                status: 'degraded',
                message: 'High heap usage',
                details
            };
        }
        return {
            status: 'healthy',
            message: 'Memory usage normal',
            details
        };
    }
    catch (error) {
        return {
            status: 'unknown',
            message: 'Memory check failed',
            error: error.message
        };
    }
}
/**
 * Determine overall health status
 */
function getOverallStatus(components) {
    const statuses = Object.values(components).map(c => c.status);
    if (statuses.includes('unhealthy')) {
        return 'unhealthy';
    }
    if (statuses.includes('degraded')) {
        return 'degraded';
    }
    return 'healthy';
}
/**
 * GET /health
 * Comprehensive health check endpoint
 */
router.get('/', async (req, res) => {
    try {
        // Run all health checks in parallel
        const [database, huggingface, filesystem, websocket, memory] = await Promise.all([
            checkDatabase(),
            checkHuggingFace(),
            checkFilesystem(),
            Promise.resolve(checkWebSocket()),
            Promise.resolve(checkMemory())
        ]);
        const components = {
            database,
            huggingface,
            filesystem,
            websocket,
            memory
        };
        const overallStatus = getOverallStatus(components);
        const healthCheck = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            components,
            system: {
                platform: os_1.default.platform(),
                nodeVersion: process.version,
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                loadAverage: os_1.default.loadavg()
            }
        };
        // Set appropriate status code
        const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
        res.status(statusCode).json({
            success: overallStatus !== 'unhealthy',
            data: healthCheck
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            data: {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            }
        });
    }
});
/**
 * GET /health/live
 * Liveness probe (simple check if server is running)
 */
router.get('/live', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});
/**
 * GET /health/ready
 * Readiness probe (check if server is ready to accept traffic)
 */
router.get('/ready', async (req, res) => {
    try {
        // Check critical components
        const dbHealthy = await (0, connection_1.healthCheck)();
        if (dbHealthy) {
            res.status(200).json({
                success: true,
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(503).json({
                success: false,
                status: 'not_ready',
                message: 'Database not ready',
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        res.status(503).json({
            success: false,
            status: 'not_ready',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /health/detailed
 * Detailed health check with comprehensive metrics for monitoring dashboard
 */
router.get('/detailed', async (req, res) => {
    try {
        // Run all health checks in parallel
        const [database, filesystem, memory] = await Promise.all([
            checkDatabase(),
            checkFilesystem(),
            Promise.resolve(checkMemory())
        ]);
        // Format checks for dashboard compatibility (array format)
        const checks = [
            {
                componentName: 'database',
                status: database.status === 'healthy' ? 'pass' : 'fail',
                responseTime: database.latency || 0,
                output: database.message
            },
            {
                componentName: 'filesystem',
                status: filesystem.status === 'healthy' ? 'pass' : 'fail',
                responseTime: 0,
                output: filesystem.message
            },
            {
                componentName: 'memory',
                status: memory.status === 'healthy' ? 'pass' : 'fail',
                output: memory.message
            },
            {
                componentName: 'diskSpace',
                status: filesystem.status === 'healthy' ? 'pass' : 'fail',
                output: filesystem.details?.diskSpace?.available
                    ? `Available: ${filesystem.details.diskSpace.available}`
                    : 'Disk space OK'
            }
        ];
        const overallStatus = checks.every(c => c.status === 'pass') ? 'healthy' :
            checks.some(c => c.status === 'fail') ? 'unhealthy' : 'degraded';
        // Additional metrics for enhanced monitoring
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const usedMem = totalMem - freeMem;
        const memPercent = ((usedMem / totalMem) * 100).toFixed(1);
        const loadAvg = os_1.default.loadavg();
        const cpuUsage = loadAvg[0] / os_1.default.cpus().length * 100;
        res.json({
            status: overallStatus,
            data: {
                checks,
                metrics: {
                    system: {
                        cpu: {
                            usage: cpuUsage,
                            cores: os_1.default.cpus().length
                        },
                        memory: {
                            used: usedMem,
                            total: totalMem,
                            usagePercent: parseFloat(memPercent)
                        },
                        uptime: process.uptime()
                    }
                }
            }
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            data: {
                checks: [],
                error: error.message
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map