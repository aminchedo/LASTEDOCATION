import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { ENV } from './env';

export const initSentry = () => {
  if (ENV.NODE_ENV === 'production' && ENV.SENTRY_DSN) {
    Sentry.init({
      dsn: ENV.SENTRY_DSN,
      environment: ENV.NODE_ENV,
      
      // Performance monitoring
      tracesSampleRate: 1.0, // 100% of transactions
      
      // Profiling
      profilesSampleRate: 1.0,
      integrations: [
        nodeProfilingIntegration(),
      ],
      
      // Release tracking
      release: process.env.npm_package_version,
      
      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        
        // Remove sensitive query params
        if (event.request?.query_string) {
          const url = new URL(`http://dummy${event.request.url}`);
          url.searchParams.delete('token');
          url.searchParams.delete('api_key');
          event.request.query_string = url.search.substring(1);
        }
        
        return event;
      },
    });

    console.log('✅ Sentry initialized');
  } else {
    console.log('⚠️  Sentry disabled (production only)');
  }
};

// Capture error with context
export const captureError = (
  error: Error,
  context?: Record<string, any>
) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// Capture message
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.captureMessage(message, level);
};

// Set user context
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

// Add breadcrumb
export const addBreadcrumb = (
  message: string,
  data?: Record<string, any>,
  category?: string
) => {
  Sentry.addBreadcrumb({
    message,
    data,
    category: category || 'custom',
    level: 'info',
  });
};
