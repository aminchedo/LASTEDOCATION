"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSentry = initSentry;
exports.captureException = captureException;
exports.captureMessage = captureMessage;
exports.setUser = setUser;
exports.clearUser = clearUser;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const env_1 = require("./env");
/**
 * Initialize Sentry for error tracking and performance monitoring
 */
function initSentry() {
    if (!env_1.env.SENTRY_DSN) {
        console.log('⚠️  Sentry DSN not configured - error tracking disabled');
        return;
    }
    Sentry.init({
        dsn: env_1.env.SENTRY_DSN,
        environment: env_1.env.NODE_ENV,
        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: env_1.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        // Set profilesSampleRate to 1.0 to profile every transaction.
        // Since profilesSampleRate is relative to tracesSampleRate,
        // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
        profilesSampleRate: env_1.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
            // Automatically instrument Node.js libraries and frameworks
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app: true }),
            new profiling_node_1.ProfilingIntegration(),
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