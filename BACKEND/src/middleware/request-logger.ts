import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { loggerStream, log } from '../config/logger';

// Custom Morgan tokens
morgan.token('user-id', (req: any) => req.user?.id || 'anonymous');
morgan.token('request-body', (req: Request) => JSON.stringify(req.body));
morgan.token('response-time-ms', (req: Request, res: Response) => {
  const startTime = req['startTime'] as number;
  return startTime ? `${Date.now() - startTime}ms` : '0ms';
});

// Morgan format
const morganFormat = ':method :url :status :response-time-ms - user::user-id';

// Morgan middleware
export const httpLogger = morgan(morganFormat, {
  stream: loggerStream,
  skip: (req) => req.url === '/health', // Skip health checks
});

// Request timing middleware
export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  req['startTime'] = Date.now();
  next();
};

// Detailed request logger (for debugging)
export const detailedRequestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { method, url, headers, body, query } = req;
  
  log.debug('Incoming request', {
    method,
    url,
    headers: {
      'user-agent': headers['user-agent'],
      'content-type': headers['content-type'],
    },
    body: method !== 'GET' ? body : undefined,
    query,
    ip: req.ip,
  });

  // Log response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    log.debug('Outgoing response', {
      method,
      url,
      statusCode: res.statusCode,
      responseTime: `${Date.now() - req['startTime']}ms`,
    });
    return originalSend.call(this, data);
  };

  next();
};
