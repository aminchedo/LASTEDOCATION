/**
 * Global type definitions for Node.js environment
 */

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
            PORT?: string;
            LOG_DIR?: string;
            CUSTOM_API_ENDPOINT?: string;
            CUSTOM_API_KEY?: string;
            CORS_ORIGIN?: string;
            JWT_SECRET?: string;
        }

        interface Global {
            fetch: typeof fetch;
        }
    }

    var fetch: typeof import('node-fetch').default;
    var process: NodeJS.Process;
    var Buffer: typeof globalThis.Buffer;
    var console: Console;
    var setTimeout: typeof globalThis.setTimeout;
    var setInterval: typeof globalThis.setInterval;
    var clearTimeout: typeof globalThis.clearTimeout;
    var clearInterval: typeof globalThis.clearInterval;
    var __dirname: string;
    var __filename: string;
    var require: NodeRequire;
    var module: NodeModule;
    var exports: any;
}

export { };
