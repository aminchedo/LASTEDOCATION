"use strict";
/**
 * Real Monitoring Service - Collects actual metrics from the application
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const logger_1 = require("../middleware/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class MonitoringService {
    constructor() {
        this.metricsPath = path_1.default.join(process.cwd(), 'logs', 'metrics.json');
        this.startTime = Date.now();
        this.initializeMetrics();
    }
    initializeMetrics() {
        try {
            if (!fs_1.default.existsSync(this.metricsPath)) {
                const initialMetrics = {
                    requests: [],
                    responseTimes: [],
                    errors: [],
                    users: new Set()
                };
                fs_1.default.writeFileSync(this.metricsPath, JSON.stringify(initialMetrics, null, 2));
            }
        }
        catch (error) {
            logger_1.logger.error({ msg: 'failed_to_initialize_metrics', error: error.message });
        }
    }
    loadMetrics() {
        try {
            if (fs_1.default.existsSync(this.metricsPath)) {
                const data = fs_1.default.readFileSync(this.metricsPath, 'utf-8');
                return JSON.parse(data);
            }
        }
        catch (error) {
            logger_1.logger.error({ msg: 'failed_to_load_metrics', error: error.message });
        }
        return { requests: [], responseTimes: [], errors: [], users: [] };
    }
    saveMetrics(metrics) {
        try {
            // Convert Set to Array for JSON serialization
            const serializableMetrics = {
                ...metrics,
                users: Array.from(metrics.users || [])
            };
            fs_1.default.writeFileSync(this.metricsPath, JSON.stringify(serializableMetrics, null, 2));
        }
        catch (error) {
            logger_1.logger.error({ msg: 'failed_to_save_metrics', error: error.message });
        }
    }
    recordRequest(responseTime, success, userId) {
        try {
            const metrics = this.loadMetrics();
            const timestamp = Date.now();
            // Record request
            metrics.requests.push({
                timestamp,
                responseTime,
                success
            });
            // Record response time
            metrics.responseTimes.push({
                timestamp,
                value: responseTime
            });
            // Record error if not successful
            if (!success) {
                metrics.errors.push({
                    timestamp,
                    error: 'request_failed'
                });
            }
            // Record user activity
            if (userId) {
                if (!metrics.users) {
                    metrics.users = new Set();
                }
                metrics.users.add(userId);
            }
            // Keep only last 24 hours of data
            const cutoff = timestamp - (24 * 60 * 60 * 1000);
            metrics.requests = metrics.requests.filter((r) => r.timestamp > cutoff);
            metrics.responseTimes = metrics.responseTimes.filter((r) => r.timestamp > cutoff);
            metrics.errors = metrics.errors.filter((e) => e.timestamp > cutoff);
            this.saveMetrics(metrics);
        }
        catch (error) {
            logger_1.logger.error({ msg: 'failed_to_record_request', error: error.message });
        }
    }
    getTimeSeriesData() {
        try {
            const metrics = this.loadMetrics();
            const now = Date.now();
            const hours = 24;
            const interval = 60 * 60 * 1000; // 1 hour
            const requests = [];
            const responseTime = [];
            const errorRate = [];
            const activeUsers = [];
            for (let i = 0; i < hours; i++) {
                const timestamp = now - (hours - 1 - i) * interval;
                const hourStart = timestamp;
                const hourEnd = timestamp + interval;
                // Count requests in this hour
                const hourRequests = metrics.requests.filter((r) => r.timestamp >= hourStart && r.timestamp < hourEnd);
                // Calculate average response time for this hour
                const hourResponseTimes = metrics.responseTimes.filter((r) => r.timestamp >= hourStart && r.timestamp < hourEnd);
                // Calculate error rate for this hour
                const hourErrors = metrics.errors.filter((e) => e.timestamp >= hourStart && e.timestamp < hourEnd);
                requests.push({
                    timestamp,
                    value: hourRequests.length
                });
                responseTime.push({
                    timestamp,
                    value: hourResponseTimes.length > 0
                        ? hourResponseTimes.reduce((sum, r) => sum + r.value, 0) / hourResponseTimes.length
                        : 0
                });
                errorRate.push({
                    timestamp,
                    value: hourRequests.length > 0 ? (hourErrors.length / hourRequests.length) * 100 : 0
                });
                activeUsers.push({
                    timestamp,
                    value: Math.min(hourRequests.length * 0.3, 50) // Estimate active users
                });
            }
            return { requests, responseTime, errorRate, activeUsers };
        }
        catch (error) {
            logger_1.logger.error({ msg: 'failed_to_get_timeseries', error: error.message });
            return {
                requests: [],
                responseTime: [],
                errorRate: [],
                activeUsers: []
            };
        }
    }
    getModelBreakdown() {
        try {
            const metrics = this.loadMetrics();
            const now = Date.now();
            const last24Hours = now - (24 * 60 * 60 * 1000);
            // Filter recent requests
            const recentRequests = metrics.requests.filter((r) => r.timestamp > last24Hours);
            const recentResponseTimes = metrics.responseTimes.filter((r) => r.timestamp > last24Hours);
            // Calculate stats for Persian model
            const persianRequests = recentRequests.length;
            const avgResponseTime = recentResponseTimes.length > 0
                ? recentResponseTimes.reduce((sum, r) => sum + r.value, 0) / recentResponseTimes.length
                : 0;
            const successfulRequests = recentRequests.filter((r) => r.success).length;
            const successRate = persianRequests > 0 ? (successfulRequests / persianRequests) * 100 : 100;
            return [
                {
                    model: 'persian-chat-v1.0',
                    requests: persianRequests,
                    avgResponseTime: Math.round(avgResponseTime),
                    successRate: Math.round(successRate * 10) / 10,
                    color: 'from-blue-500 to-blue-600'
                }
            ];
        }
        catch (error) {
            logger_1.logger.error({ msg: 'failed_to_get_model_breakdown', error: error.message });
            return [];
        }
    }
    getMonitoringStats() {
        try {
            const metrics = this.loadMetrics();
            const now = Date.now();
            const last24Hours = now - (24 * 60 * 60 * 1000);
            const recentRequests = metrics.requests.filter((r) => r.timestamp > last24Hours);
            const recentResponseTimes = metrics.responseTimes.filter((r) => r.timestamp > last24Hours);
            const recentErrors = metrics.errors.filter((e) => e.timestamp > last24Hours);
            const totalRequests = recentRequests.length;
            const avgResponseTime = recentResponseTimes.length > 0
                ? recentResponseTimes.reduce((sum, r) => sum + r.value, 0) / recentResponseTimes.length
                : 0;
            const errorRate = totalRequests > 0 ? (recentErrors.length / totalRequests) * 100 : 0;
            const activeUsers = metrics.users ? metrics.users.length : 0;
            const uptime = Date.now() - this.startTime;
            return {
                totalRequests,
                avgResponseTime: Math.round(avgResponseTime),
                errorRate: Math.round(errorRate * 10) / 10,
                activeUsers,
                uptime: Math.round(uptime / 1000) // Convert to seconds
            };
        }
        catch (error) {
            logger_1.logger.error({ msg: 'failed_to_get_monitoring_stats', error: error.message });
            return {
                totalRequests: 0,
                avgResponseTime: 0,
                errorRate: 0,
                activeUsers: 0,
                uptime: 0
            };
        }
    }
    getPercentiles() {
        try {
            const metrics = this.loadMetrics();
            const recentResponseTimes = metrics.responseTimes
                .map((r) => r.value)
                .sort((a, b) => a - b);
            if (recentResponseTimes.length === 0) {
                return [
                    { percentile: 'P50', value: 0, color: 'text-[color:var(--c-primary)]' },
                    { percentile: 'P90', value: 0, color: 'text-[color:var(--c-warning)]' },
                    { percentile: 'P95', value: 0, color: 'text-[color:var(--c-danger)]' },
                    { percentile: 'P99', value: 0, color: 'text-[color:var(--c-danger)]' }
                ];
            }
            const getPercentile = (p) => {
                const index = Math.ceil((p / 100) * recentResponseTimes.length) - 1;
                return recentResponseTimes[Math.max(0, index)];
            };
            return [
                { percentile: 'P50', value: Math.round(getPercentile(50)), color: 'text-[color:var(--c-primary)]' },
                { percentile: 'P90', value: Math.round(getPercentile(90)), color: 'text-[color:var(--c-warning)]' },
                { percentile: 'P95', value: Math.round(getPercentile(95)), color: 'text-[color:var(--c-danger)]' },
                { percentile: 'P99', value: Math.round(getPercentile(99)), color: 'text-[color:var(--c-danger)]' }
            ];
        }
        catch (error) {
            logger_1.logger.error({ msg: 'failed_to_get_percentiles', error: error.message });
            return [
                { percentile: 'P50', value: 0, color: 'text-[color:var(--c-primary)]' },
                { percentile: 'P90', value: 0, color: 'text-[color:var(--c-warning)]' },
                { percentile: 'P95', value: 0, color: 'text-[color:var(--c-danger)]' },
                { percentile: 'P99', value: 0, color: 'text-[color:var(--c-danger)]' }
            ];
        }
    }
}
exports.MonitoringService = MonitoringService;
//# sourceMappingURL=monitoringService.js.map