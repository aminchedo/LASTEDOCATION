import { NextFunction, Request, Response } from 'express';
import { logger } from './logger';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode || err.status || 500;
  const payload = {
    error: true,
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  };
  logger.error({ msg: 'Unhandled error', status, err: err?.stack || err });
  res.status(status).json(payload);
}
