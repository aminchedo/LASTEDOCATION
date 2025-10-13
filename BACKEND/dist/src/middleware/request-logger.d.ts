import { Request, Response, NextFunction } from 'express';
/**
 * Morgan HTTP request logger middleware
 */
export declare const requestLogger: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, callback: (err?: Error) => void) => void;
/**
 * Custom request logger middleware for detailed logging
 */
export declare function detailedRequestLogger(req: Request, res: Response, next: NextFunction): void;
export default requestLogger;
//# sourceMappingURL=request-logger.d.ts.map