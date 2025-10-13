import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { env } from './env';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  if (!env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set profilesSampleRate to 1.0 to profile every transaction.
    // Since profilesSampleRate is relative to tracesSampleRate,
    // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
    profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Automatically instrument Node.js libraries and frameworks
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: true }),
      new ProfilingIntegration(),
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
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
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
