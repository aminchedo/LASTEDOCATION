/**
 * Rate Limiting Middleware
 * Protects against abuse with configurable limits per endpoint
 */
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';
import winston from 'winston';
import path from 'path';

// Configure logger for rate limit violations
const rateLimitLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'rate-limit.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ]
});

/**
 * Custom key generator that uses IP + User ID for authenticated requests
 */
const keyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  // For authenticated users, use user ID for more accurate rate limiting
  if (userId) {
    return `user:${userId}`;
  }
  
  // For unauthenticated users, use IP
  return `ip:${ip}`;
};

/**
 * Handler called when rate limit is exceeded
 */
const rateLimitHandler = (req: Request, res: Response): void => {
  const userId = (req as any).user?.id;
  const ip = req.ip || req.socket.remoteAddress;
  
  // Log rate limit violation
  rateLimitLogger.warn({
    timestamp: new Date().toISOString(),
    type: 'RateLimitExceeded',
    path: req.path,
    method: req.method,
    ip,
    userId,
    userAgent: req.get('user-agent')
  });

  res.status(429).json({
    success: false,
    error: 'TooManyRequests',
    message: 'Too many requests from this IP/user. Please try again later.',
    statusCode: 429,
    timestamp: new Date().toISOString(),
    retryAfter: res.getHeader('Retry-After')
  });
};

/**
 * Skip rate limiting for certain conditions
 */
const skip = (req: Request): boolean => {
  // Skip rate limiting for health checks
  if (req.path === '/health' || req.path === '/api/health') {
    return true;
  }
  
  // Skip for localhost in development
  if (process.env.NODE_ENV === 'development') {
    const ip = req.ip || req.socket.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return false; // Still apply rate limits even in dev for testing
    }
  }
  
  return false;
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP/user
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator,
  handler: rateLimitHandler,
  skip
});

/**
 * Strict rate limiter for authentication endpoints
 * 10 requests per hour
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // Don't count successful logins
  skip
});

/**
 * Download endpoint rate limiter
 * 10 requests per hour to prevent abuse
 */
export const downloadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 download requests per hour
  message: 'Too many download requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip
});

/**
 * Training creation rate limiter
 * 5 requests per hour to prevent resource abuse
 */
export const trainingLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 training jobs per hour
  message: 'Too many training requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip
});

/**
 * Search endpoint rate limiter
 * 30 requests per 15 minutes
 */
export const searchLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 search requests per window
  message: 'Too many search requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip
});

/**
 * Settings update rate limiter
 * 20 requests per hour
 */
export const settingsLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 settings updates per hour
  message: 'Too many settings updates, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip
});

/**
 * Lenient rate limiter for public endpoints
 * 200 requests per 15 minutes
 */
export const publicLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip
});

export default {
  generalLimiter,
  authLimiter,
  downloadLimiter,
  trainingLimiter,
  searchLimiter,
  settingsLimiter,
  publicLimiter
};
