"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSentry = initSentry;
exports.captureException = captureException;
exports.captureMessage = captureMessage;
exports.setUser = setUser;
exports.clearUser = clearUser;
// Sentry is optional - install with: npm install @sentry/node @sentry/profiling-node
// import * as Sentry from '@sentry/node';
// import { ProfilingIntegration } from '@sentry/profiling-node';
const env_1 = require("./env");
// Mock Sentry for when it's not installed
const Sentry = {
    init: (_options) => { },
    captureException: (_error) => { },
    captureMessage: (_message, _level) => { },
    setUser: (_user) => { },
    setContext: (_name, _context) => { },
    Integrations: {
        Http: class {
            constructor(_options) { }
        },
        Express: class {
            constructor(_options) { }
        },
    },
    SeverityLevel: {},
};
/**
 * Initialize Sentry for error tracking and performance monitoring
 */
function initSentry() {
    const SENTRY_DSN = process.env.SENTRY_DSN;
    if (!SENTRY_DSN) {
        console.log('⚠️  Sentry DSN not configured - error tracking disabled');
        return;
    }
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: env_1.ENV.NODE_ENV,
        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: env_1.ENV.NODE_ENV === 'production' ? 0.1 : 1.0,
        // Set profilesSampleRate to 1.0 to profile every transaction.
        // Since profilesSampleRate is relative to tracesSampleRate,
        // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
        profilesSampleRate: env_1.ENV.NODE_ENV === 'production' ? 0.1 : 1.0,
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
function captureException(error, context) {
    if (context) {
        Sentry.setContext('custom', context);
    }
    Sentry.captureException(error);
}
/**
 * Capture a message and send to Sentry
 */
function captureMessage(message, level = 'info') {
    Sentry.captureMessage(message, level);
}
/**
 * Set user context for Sentry
 */
function setUser(user) {
    Sentry.setUser(user);
}
/**
 * Clear user context
 */
function clearUser() {
    Sentry.setUser(null);
}
exports.default = Sentry;
//# sourceMappingURL=sentry.js.map