import { Request, Response, NextFunction } from 'express';
import { analyticsTracker } from '../monitoring/analytics';

export const trackAnalytics = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Override res.send to capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    analyticsTracker.track(req, res, duration);
    return originalSend.call(this, data);
  };

  next();
};
