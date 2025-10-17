"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
exports.detailedRequestLogger = detailedRequestLogger;
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = require("../config/logger");
/**
 * Morgan HTTP request logger middleware
 */
exports.requestLogger = (0, morgan_1.default)(':remote-addr :method :url :status :res[content-length] - :response-time ms', { stream: logger_1.stream });
/**
 * Custom request logger middleware for detailed logging
 */
function detailedRequestLogger(req, res, next) {
    const start = Date.now();
    // Log request
    logger_1.logger.http(`→ ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'error' : 'http';
        logger_1.logger.log(level, `← ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
        });
    });
    next();
}
exports.default = exports.requestLogger;
//# sourceMappingURL=request-logger.js.map