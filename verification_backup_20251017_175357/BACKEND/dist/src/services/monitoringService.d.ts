/**
 * Real Monitoring Service - Collects actual metrics from the application
 */
export interface MetricData {
    timestamp: number;
    value: number;
}
export interface TimeSeriesData {
    requests: MetricData[];
    responseTime: MetricData[];
    errorRate: MetricData[];
    activeUsers: MetricData[];
}
export interface ModelBreakdown {
    model: string;
    requests: number;
    avgResponseTime: number;
    successRate: number;
    color: string;
}
export interface MonitoringStats {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    activeUsers: number;
    uptime: number;
}
export declare class MonitoringService {
    private readonly metricsPath;
    private startTime;
    constructor();
    private initializeMetrics;
    private loadMetrics;
    private saveMetrics;
    recordRequest(responseTime: number, success: boolean, userId?: string): void;
    getTimeSeriesData(): TimeSeriesData;
    getModelBreakdown(): ModelBreakdown[];
    getMonitoringStats(): MonitoringStats;
    getPercentiles(): Array<{
        percentile: string;
        value: number;
        color: string;
    }>;
}
//# sourceMappingURL=monitoringService.d.ts.map