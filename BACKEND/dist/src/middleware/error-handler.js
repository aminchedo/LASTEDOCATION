"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.handleUncaughtException = exports.handleUnhandledRejection = exports.globalErrorHandler = exports.OperationalError = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure logs directory exists
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Configure Winston logger for errors
const errorLogger = winston_1.default.createLogger({
    level: 'error',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        // Write errors to file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        // Also log to console in development
        ...(process.env.NODE_ENV !== 'production'
            ? [new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                })]
            : [])
    ]
});
// Custom error class for operational errors
class OperationalError extends Error {
    constructor(message, statusCode = 500, context) {
        super(message);
        this.name = 'OperationalError';
        this.statusCode = statusCode;
        this.isOperational = true;
        this.context = context;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.OperationalError = OperationalError;
/**
 * Global error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
    // Generate request ID if not exists
    const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Extract error details
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';
    const isOperational = err.isOperational || false;
    // Log error with full context
    errorLogger.error({
        requestId,
        timestamp: new Date().toISOString(),
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            statusCode,
            isOperational
        },
        request: {
            method: req.method,
            url: req.url,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id,
            body: sanitizeRequestBody(req.body),
            query: req.query,
            params: req.params
        },
        context: err.context || {}
    });
    // Prepare safe error response (no stack traces to client)
    const errorResponse = {
        success: false,
        error: err.name || 'Error',
        message: getSafeErrorMessage(err, isOperational),
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId
    };
    // Add validation details for validation errors
    if (err.name === 'ValidationError' && err.details) {
        errorResponse.details = err.details;
    }
    // Add details for Zod validation errors
    if (err.name === 'ZodError' && err.errors) {
        errorResponse.details = err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code
        }));
    }
    // Send response
    res.status(statusCode).json(errorResponse);
};
exports.globalErrorHandler = globalErrorHandler;
/**
 * Get safe error message (hide internal errors in production)
 */
function getSafeErrorMessage(err, isOperational) {
    // In production, hide internal error details
    if (process.env.NODE_ENV === 'production' && !isOperational) {
        return 'An unexpected error occurred. Please try again later.';
    }
    // Return actual message for operational errors or in development
    return err.message || 'Internal server error';
}
/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }
    const sanitized = { ...body };
    const sensitiveFields = [
        'password',
        'token',
        'apiKey',
        'api_key',
        'secret',
        'accessToken',
        'refreshToken',
        'huggingfaceToken',
        'huggingface_token'
    ];
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '***REDACTED***';
        }
    }
    return sanitized;
}
/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason, promise) => {
        errorLogger.error({
            type: 'UnhandledRejection',
            timestamp: new Date().toISOString(),
            reason: reason instanceof Error ? {
                name: reason.name,
                message: reason.message,
                stack: reason.stack
            } : reason,
            promise: promise.toString()
        });
        // In production, exit process on unhandled rejection
        if (process.env.NODE_ENV === 'production') {
            console.error('UNHANDLED REJECTION! Shutting down...');
            process.exit(1);
        }
    });
};
exports.handleUnhandledRejection = handleUnhandledRejection;
/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
    process.on('uncaughtException', (err) => {
        errorLogger.error({
            type: 'UncaughtException',
            timestamp: new Date().toISOString(),
            error: {
                name: err.name,
                message: err.message,
                stack: err.stack
            }
        });
        console.error('UNCAUGHT EXCEPTION! Shutting down...');
        console.error(err.name, err.message);
        process.exit(1);
    });
};
exports.handleUncaughtException = handleUncaughtException;
/**
 * Not found handler (404)
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `Cannot ${req.method} ${req.path}`,
        statusCode: 404,
        timestamp: new Date().toISOString(),
        path: req.path
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
exports.default = exports.globalErrorHandler;
//# sourceMappingURL=error-handler.js.map