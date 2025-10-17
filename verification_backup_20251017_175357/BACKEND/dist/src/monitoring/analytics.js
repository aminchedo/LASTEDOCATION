"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = getAnalytics;
exports.resetAnalyticsEndpoint = resetAnalyticsEndpoint;
exports.getAnalyticsSummary = getAnalyticsSummary;
const analytics_1 = require("../middleware/analytics");
/**
 * Get analytics data endpoint
 */
function getAnalytics(req, res) {
    try {
        const data = (0, analytics_1.getAnalytics)();
        const analytics = {
            requests: {
                total: data.total,
                byEndpoint: data.byEndpoint,
                byMethod: data.byMethod,
                byStatus: data.byStatus,
            },
            performance: {
                averageResponseTime: data.averageResponseTime,
                successRate: data.successRate,
            },
            errors: {
                total: data.errors,
                rate: data.total > 0 ? ((data.errors / data.total) * 100).toFixed(2) + '%' : '0%',
            },
            period: {
                lastReset: data.lastReset,
                uptimeSinceReset: Math.round((Date.now() - data.lastReset.getTime()) / 1000),
            },
        };
        res.json({
            status: 'success',
            data: analytics,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get analytics',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * Reset analytics endpoint
 */
function resetAnalyticsEndpoint(req, res) {
    try {
        (0, analytics_1.resetAnalytics)();
        res.json({
            status: 'success',
            message: 'Analytics reset successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to reset analytics',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * Get analytics summary
 */
function getAnalyticsSummary(req, res) {
    try {
        const data = (0, analytics_1.getAnalytics)();
        // Get top endpoints
        const topEndpoints = Object.entries(data.byEndpoint)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([endpoint, count]) => ({ endpoint, count }));
        // Get error endpoints
        const errorEndpoints = Object.entries(data.byEndpoint)
            .filter(([endpoint]) => {
            // This is simplified - in production, track errors per endpoint
            return false;
        });
        res.json({
            status: 'success',
            data: {
                summary: {
                    totalRequests: data.total,
                    averageResponseTime: data.averageResponseTime + 'ms',
                    successRate: data.successRate,
                    errorRate: ((data.errors / data.total) * 100).toFixed(2) + '%',
                },
                topEndpoints,
                methodDistribution: data.byMethod,
                statusDistribution: data.byStatus,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get analytics summary',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
exports.default = {
    getAnalytics,
    resetAnalyticsEndpoint,
    getAnalyticsSummary,
};
//# sourceMappingURL=analytics.js.map