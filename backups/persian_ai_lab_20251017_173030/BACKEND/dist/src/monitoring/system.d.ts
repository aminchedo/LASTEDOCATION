import { Request, Response } from 'express';
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
export declare function getSystemMetrics(req: Request, res: Response): Promise<void>;
/**
 * Get disk usage (Linux only)
 */
export declare function getDiskUsage(req: Request, res: Response): Promise<void>;
declare const _default: {
    getSystemMetrics: typeof getSystemMetrics;
    getDiskUsage: typeof getDiskUsage;
};
export default _default;
//# sourceMappingURL=system.d.ts.map