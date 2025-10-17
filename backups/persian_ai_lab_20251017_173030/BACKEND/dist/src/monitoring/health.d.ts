import { Request, Response } from 'express';
/**
 * Health check status
 */
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: {
        database?: HealthCheck;
        memory?: HealthCheck;
        disk?: HealthCheck;
        api?: HealthCheck;
    };
}
export interface HealthCheck {
    status: 'pass' | 'warn' | 'fail';
    message?: string;
    value?: any;
}
/**
 * Basic health check endpoint
 */
export declare function basicHealthCheck(req: Request, res: Response): void;
/**
 * Detailed health check with system metrics
 */
export declare function detailedHealthCheck(req: Request, res: Response): Promise<void>;
declare const _default: {
    basicHealthCheck: typeof basicHealthCheck;
    detailedHealthCheck: typeof detailedHealthCheck;
};
export default _default;
//# sourceMappingURL=health.d.ts.map