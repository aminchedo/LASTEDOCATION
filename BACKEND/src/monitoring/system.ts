import os from 'os';
import { log } from '../config/logger';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  uptime: number;
  timestamp: Date;
}

class SystemMonitor {
  private cpuUsage = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Start monitoring
  start(intervalMs: number = 60000) {
    // Update CPU usage periodically
    this.updateCpuUsage();
    
    this.monitoringInterval = setInterval(() => {
      this.updateCpuUsage();
      const metrics = this.getMetrics();
      
      // Log warnings for high resource usage
      if (metrics.memory.usagePercent > 90) {
        log.warn('High memory usage detected', metrics);
      }
      
      if (metrics.cpu.usage > 90) {
        log.warn('High CPU usage detected', metrics);
      }
    }, intervalMs);
  }

  // Stop monitoring
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Get current metrics
  getMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      cpu: {
        usage: this.cpuUsage,
        cores: os.cpus().length,
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercent: (usedMem / totalMem) * 100,
      },
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }

  // Calculate CPU usage
  private updateCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (100 * idle) / total;

    this.cpuUsage = Math.round(usage * 100) / 100;
  }
}

export const systemMonitor = new SystemMonitor();
