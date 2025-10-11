export interface RealMetrics {
    totalRequests: number;
    avgResponseTimeMs: number;
    successRate: number;
    errorRate: number;
    requestsOverTime: Array<{
        timestamp: number;
        value: number;
    }>;
    responseTimeDistribution: Array<{
        range: string;
        count: number;
    }>;
    recentActivity: Array<{
        id: string;
        timestamp: number;
        method: string;
        path: string;
        status: number;
        duration: number;
    }>;
}
export declare function getRealMetrics(): RealMetrics;
export interface ActivityEvent {
    id: string;
    type: 'request' | 'download' | 'training' | 'tts';
    timestamp: number;
    description: string;
    status: 'success' | 'error' | 'pending';
    metadata?: Record<string, any>;
}
export declare function getRecentActivity(limit?: number): ActivityEvent[];
//# sourceMappingURL=monitoring.d.ts.map