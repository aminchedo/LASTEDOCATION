/**
 * Rate Limiting Middleware
 * Protects against abuse with configurable limits per endpoint
 */
import { RateLimitRequestHandler } from 'express-rate-limit';
/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP/user
 */
export declare const generalLimiter: RateLimitRequestHandler;
/**
 * Strict rate limiter for authentication endpoints
 * 10 requests per hour
 */
export declare const authLimiter: RateLimitRequestHandler;
/**
 * Download endpoint rate limiter
 * 10 requests per hour to prevent abuse
 */
export declare const downloadLimiter: RateLimitRequestHandler;
/**
 * Training creation rate limiter
 * 5 requests per hour to prevent resource abuse
 */
export declare const trainingLimiter: RateLimitRequestHandler;
/**
 * Search endpoint rate limiter
 * 30 requests per 15 minutes
 */
export declare const searchLimiter: RateLimitRequestHandler;
/**
 * Settings update rate limiter
 * 20 requests per hour
 */
export declare const settingsLimiter: RateLimitRequestHandler;
/**
 * Lenient rate limiter for public endpoints
 * 200 requests per 15 minutes
 */
export declare const publicLimiter: RateLimitRequestHandler;
declare const _default: {
    generalLimiter: RateLimitRequestHandler;
    authLimiter: RateLimitRequestHandler;
    downloadLimiter: RateLimitRequestHandler;
    trainingLimiter: RateLimitRequestHandler;
    searchLimiter: RateLimitRequestHandler;
    settingsLimiter: RateLimitRequestHandler;
    publicLimiter: RateLimitRequestHandler;
};
export default _default;
//# sourceMappingURL=rate-limiter.d.ts.map