"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsMiddleware = analyticsMiddleware;
exports.getAnalytics = getAnalytics;
exports.resetAnalytics = resetAnalytics;
const logger_1 = require("../config/logger");
const analytics = {
    totalRequests: 0,
    requestsByEndpoint: new Map(),
    requestsByMethod: new Map(),
    requestsByStatus: new Map(),
    averageResponseTime: 0,
    errors: 0,
    lastReset: new Date(),
};
let totalResponseTime = 0;
/**
 * Analytics middleware to track request metrics
 */
function analyticsMiddleware(req, res, next) {
    const start = Date.now();
    // Track request
    analytics.totalRequests++;
    // Track by endpoint
    const endpoint = `${req.method} ${req.path}`;
    analytics.requestsByEndpoint.set(endpoint, (analytics.requestsByEndpoint.get(endpoint) || 0) + 1);
    // Track by method
    analytics.requestsByMethod.set(req.method, (analytics.requestsByMethod.get(req.method) || 0) + 1);
    // Track response
    res.on('finish', () => {
        const duration = Date.now() - start;
        // Track response time
        totalResponseTime += duration;
        analytics.averageResponseTime = totalResponseTime / analytics.totalRequests;
        // Track by status code
        analytics.requestsByStatus.set(res.statusCode, (analytics.requestsByStatus.get(res.statusCode) || 0) + 1);
        // Track errors
        if (res.statusCode >= 400) {
            analytics.errors++;
        }
    });
    next();
}
/**
 * Get current analytics data
 */
function getAnalytics() {
    return {
        total: analytics.totalRequests,
        byEndpoint: Object.fromEntries(analytics.requestsByEndpoint),
        byMethod: Object.fromEntries(analytics.requestsByMethod),
        byStatus: Object.fromEntries(analytics.requestsByStatus),
        averageResponseTime: Math.round(analytics.averageResponseTime),
        errors: analytics.errors,
        successRate: analytics.totalRequests > 0
            ? ((analytics.totalRequests - analytics.errors) / analytics.totalRequests * 100).toFixed(2) + '%'
            : '100%',
        lastReset: analytics.lastReset,
    };
}
/**
 * Reset analytics data
 */
function resetAnalytics() {
    analytics.totalRequests = 0;
    analytics.requestsByEndpoint.clear();
    analytics.requestsByMethod.clear();
    analytics.requestsByStatus.clear();
    analytics.averageResponseTime = 0;
    analytics.errors = 0;
    analytics.lastReset = new Date();
    totalResponseTime = 0;
    logger_1.logger.info('Analytics data reset');
}
exports.default = analyticsMiddleware;
//# sourceMappingURL=analytics.js.map