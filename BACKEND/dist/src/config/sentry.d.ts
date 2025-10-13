declare const Sentry: {
    init: (_options?: any) => void;
    captureException: (_error: any) => void;
    captureMessage: (_message: string, _level?: any) => void;
    setUser: (_user: any) => void;
    setContext: (_name: string, _context: any) => void;
    Integrations: {
        Http: {
            new (_options?: any): {};
        };
        Express: {
            new (_options?: any): {};
        };
    };
    SeverityLevel: any;
};
type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
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
export declare function captureMessage(message: string, level?: SeverityLevel): void;
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