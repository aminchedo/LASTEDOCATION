import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { log } from '../config/logger';
import { captureError } from '../config/sentry';

// Custom error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  // Log error
  log.error('Request error', {
    error: {
      message: err.message,
      stack: err.stack,
      statusCode,
      isOperational,
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
      userId: req['user']?.id,
    },
  });

  // Send to Sentry (only non-operational errors)
  if (!isOperational) {
    captureError(err, {
      method: req.method,
      url: req.url,
      userId: req['user']?.id,
    });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
      }),
    },
  });
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

// Async handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
