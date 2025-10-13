/**
 * Comprehensive Health Check Endpoint
 * Tests all critical system components
 */
import { Router, Request, Response } from 'express';
import { healthCheck as dbHealthCheck } from '../database/connection';
import { hfService } from '../services/huggingface.service';
import { getWebSocketServer } from '../services/websocket-real.service';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = Router();

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  components: {
    database: ComponentHealth;
    huggingface: ComponentHealth;
    filesystem: ComponentHealth;
    websocket: ComponentHealth;
    memory: ComponentHealth;
  };
  system: {
    platform: string;
    nodeVersion: string;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    loadAverage: number[];
  };
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  latency?: number;
  details?: any;
  error?: string;
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  
  try {
    const isHealthy = await dbHealthCheck();
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
    } else {
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        latency,
        details: {
          connected: false
        }
      };
    }
  } catch (error: any) {
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
async function checkHuggingFace(): Promise<ComponentHealth> {
  const start = Date.now();
  
  try {
    // Try to validate a dummy token to check API connectivity
    // If no token or invalid token, API will return 401 but that means it's reachable
    const result = await hfService.validateToken('hf_test');
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
  } catch (error: any) {
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
async function checkFilesystem(): Promise<ComponentHealth> {
  try {
    const modelsDir = path.join(process.cwd(), 'models');
    
    // Ensure directory exists
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    
    // Check if directory is writable
    const testFile = path.join(modelsDir, '.health_check_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    // Get disk space info
    const stats = fs.statfsSync ? fs.statfsSync(modelsDir) : null;
    let diskSpace: any = { available: 'unknown' };
    
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
  } catch (error: any) {
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
function checkWebSocket(): ComponentHealth {
  try {
    const io = getWebSocketServer();
    
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
  } catch (error: any) {
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
function checkMemory(): ComponentHealth {
  try {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
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
  } catch (error: any) {
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
function getOverallStatus(components: HealthCheckResult['components']): 'healthy' | 'degraded' | 'unhealthy' {
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
router.get('/', async (req: Request, res: Response): Promise<void> => {
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
    
    const healthCheck: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      components,
      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        loadAverage: os.loadavg()
      }
    };
    
    // Set appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: overallStatus !== 'unhealthy',
      data: healthCheck
    });
  } catch (error: any) {
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
router.get('/live', (req: Request, res: Response): void => {
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
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check critical components
    const dbHealthy = await dbHealthCheck();
    
    if (dbHealthy) {
      res.status(200).json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'not_ready',
        message: 'Database not ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
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
router.get('/detailed', async (req: Request, res: Response): Promise<void> => {
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
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);
    
    const loadAvg = os.loadavg();
    const cpuUsage = loadAvg[0] / os.cpus().length * 100;

    res.json({
      status: overallStatus,
      data: {
        checks,
        metrics: {
          system: {
            cpu: {
              usage: cpuUsage,
              cores: os.cpus().length
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
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      data: {
        checks: [],
        error: error.message
      }
    });
  }
});

export default router;
