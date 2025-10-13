import * as Sentry from '@sentry/node';
/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export declare function initSentry(): void;
/**
 * Capture an exception and send to Sentry
 */
export declare function captureException(error: Error, context?: Record<string, any>): void;
/**
 * Capture a message and send to Sentry
 */
export declare function captureMessage(message: string, level?: Sentry.SeverityLevel): void;
/**
 * Set user context for Sentry
 */
export declare function setUser(user: {
    id: string;
    email?: string;
    username?: string;
}): void;
/**
 * Clear user context
 */
export declare function clearUser(): void;
export default Sentry;
//# sourceMappingURL=sentry.d.ts.map