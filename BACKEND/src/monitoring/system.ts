import { Request, Response } from 'express';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * System metrics interface
 */
export interface SystemMetrics {
  timestamp: string;
  cpu: {
    count: number;
    model: string;
    speed: number;
    usage: number[];
    loadAverage: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    formatted: {
      total: string;
      free: string;
      used: string;
    };
  };
  os: {
    platform: string;
    type: string;
    release: string;
    arch: string;
    hostname: string;
    uptime: number;
  };
  process: {
    pid: number;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    versions: NodeJS.ProcessVersions;
  };
}

/**
 * Get comprehensive system metrics
 */
export async function getSystemMetrics(req: Request, res: Response) {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        speed: cpus[0]?.speed || 0,
        usage: await getCPUUsage(),
        loadAverage: os.loadavg(),
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
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
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
  } catch (error) {
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
async function getCPUUsage(): Promise<number[]> {
  const cpus = os.cpus();
  
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
function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get disk usage (Linux only)
 */
export async function getDiskUsage(req: Request, res: Response) {
  try {
    if (os.platform() !== 'linux') {
      return res.json({
        status: 'success',
        message: 'Disk usage only available on Linux',
        data: null,
      });
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
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get disk usage',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default {
  getSystemMetrics,
  getDiskUsage,
};
