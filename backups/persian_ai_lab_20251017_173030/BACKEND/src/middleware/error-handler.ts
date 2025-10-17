/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and provides safe error responses
 */
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure Winston logger for errors
const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write errors to file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Also log to console in development
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })]
      : []
    )
  ]
});

// Custom error class for operational errors
export class OperationalError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public context?: Record<string, any>;

  constructor(message: string, statusCode: number = 500, context?: Record<string, any>) {
    super(message);
    this.name = 'OperationalError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  requestId?: string;
  details?: any;
}

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate request ID if not exists
  const requestId = (req as any).id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
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
      userId: (req as any).user?.id,
      body: sanitizeRequestBody(req.body),
      query: req.query,
      params: req.params
    },
    context: err.context || {}
  });

  // Prepare safe error response (no stack traces to client)
  const errorResponse: ErrorResponse = {
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
    errorResponse.details = err.errors.map((e: any) => ({
      path: e.path.join('.'),
      message: e.message,
      code: e.code
    }));
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Get safe error message (hide internal errors in production)
 */
function getSafeErrorMessage(err: any, isOperational: boolean): string {
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
function sanitizeRequestBody(body: any): any {
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
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
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

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (err: Error) => {
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

/**
 * Not found handler (404)
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.path}`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default globalErrorHandler;
