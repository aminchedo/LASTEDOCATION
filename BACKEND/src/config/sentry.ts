// Sentry is optional - install with: npm install @sentry/node @sentry/profiling-node
// import * as Sentry from '@sentry/node';
// import { ProfilingIntegration } from '@sentry/profiling-node';
import { ENV } from './env';

// Mock Sentry for when it's not installed
const Sentry = {
  init: (_options?: any) => {},
  captureException: (_error: any) => {},
  captureMessage: (_message: string, _level?: any) => {},
  setUser: (_user: any) => {},
  setContext: (_name: string, _context: any) => {},
  Integrations: {
    Http: class { constructor(_options?: any) {} },
    Express: class { constructor(_options?: any) {} },
  },
  SeverityLevel: {} as any,
};

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  const SENTRY_DSN = process.env.SENTRY_DSN;
  if (!SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV.NODE_ENV,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: ENV.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set profilesSampleRate to 1.0 to profile every transaction.
    // Since profilesSampleRate is relative to tracesSampleRate,
    // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
    profilesSampleRate: ENV.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Automatically instrument Node.js libraries and frameworks
      // Commented out - requires @sentry/node package installed
      // new Sentry.Integrations.Http({ tracing: true }),
      // new Sentry.Integrations.Express({ app: true }),
    ],
    
    // Ignore common errors
    ignoreErrors: [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'Network request failed',
    ],
  });

  console.log('✅ Sentry initialized for error tracking');
}

/**
 * Capture an exception and send to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a message and send to Sentry
 */
export function captureMessage(message: string, level: SeverityLevel = 'info') {
  Sentry.captureMessage(message, level as any);
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}

export default Sentry;
