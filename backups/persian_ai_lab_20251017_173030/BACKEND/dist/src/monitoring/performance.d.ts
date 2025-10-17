import { Request, Response } from 'express';
/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
    timestamp: string;
    process: {
        uptime: number;
        memory: NodeJS.MemoryUsage;
        cpu: {
            user: number;
            system: number;
        };
    };
    system: {
        platform: string;
        arch: string;
        nodeVersion: string;
        loadAverage: number[];
        freeMemory: string;
        totalMemory: string;
        cpuCount: number;
    };
    performance: {
        eventLoopLag?: number;
        responseTime?: number;
    };
}
/**
 * Get performance metrics
 */
export declare function getPerformanceMetrics(req: Request, res: Response): void;
/**
 * Track response time
 */
export declare function trackResponseTime(duration: number): void;
/**
 * Get performance summary
 */
export declare function getPerformanceSummary(): {
    averageResponseTime: number | undefined;
    sampleCount: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
};
declare const _default: {
    getPerformanceMetrics: typeof getPerformanceMetrics;
    trackResponseTime: typeof trackResponseTime;
    getPerformanceSummary: typeof getPerformanceSummary;
};
export default _default;
//# sourceMappingURL=performance.d.ts.map