/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and provides safe error responses
 */
import { Request, Response, NextFunction } from 'express';
export declare class OperationalError extends Error {
    statusCode: number;
    isOperational: boolean;
    context?: Record<string, any>;
    constructor(message: string, statusCode?: number, context?: Record<string, any>);
}
/**
 * Global error handler middleware
 */
export declare const globalErrorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
/**
 * Handle unhandled promise rejections
 */
export declare const handleUnhandledRejection: () => void;
/**
 * Handle uncaught exceptions
 */
export declare const handleUncaughtException: () => void;
/**
 * Not found handler (404)
 */
export declare const notFoundHandler: (req: Request, res: Response) => void;
/**
 * Async handler wrapper to catch errors in async route handlers
 */
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export default globalErrorHandler;
//# sourceMappingURL=error-handler.d.ts.map