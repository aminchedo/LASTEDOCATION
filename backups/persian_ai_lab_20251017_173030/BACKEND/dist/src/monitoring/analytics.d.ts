import { Request, Response } from 'express';
/**
 * Extended analytics interface
 */
export interface Analytics {
    requests: {
        total: number;
        byEndpoint: Record<string, number>;
        byMethod: Record<string, number>;
        byStatus: Record<string, number>;
    };
    performance: {
        averageResponseTime: number;
        successRate: string;
    };
    errors: {
        total: number;
        rate: string;
    };
    period: {
        lastReset: Date;
        uptimeSinceReset: number;
    };
}
/**
 * Get analytics data endpoint
 */
export declare function getAnalytics(req: Request, res: Response): void;
/**
 * Reset analytics endpoint
 */
export declare function resetAnalyticsEndpoint(req: Request, res: Response): void;
/**
 * Get analytics summary
 */
export declare function getAnalyticsSummary(req: Request, res: Response): void;
declare const _default: {
    getAnalytics: typeof getAnalytics;
    resetAnalyticsEndpoint: typeof resetAnalyticsEndpoint;
    getAnalyticsSummary: typeof getAnalyticsSummary;
};
export default _default;
//# sourceMappingURL=analytics.d.ts.map