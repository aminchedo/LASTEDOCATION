import { Request, Response, NextFunction } from 'express';
/**
 * Analytics middleware to track request metrics
 */
export declare function analyticsMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Get current analytics data
 */
export declare function getAnalytics(): {
    total: number;
    byEndpoint: {
        [k: string]: number;
    };
    byMethod: {
        [k: string]: number;
    };
    byStatus: {
        [k: string]: number;
    };
    averageResponseTime: number;
    errors: number;
    successRate: string;
    lastReset: Date;
};
/**
 * Reset analytics data
 */
export declare function resetAnalytics(): void;
export default analyticsMiddleware;
//# sourceMappingURL=analytics.d.ts.map