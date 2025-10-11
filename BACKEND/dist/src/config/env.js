"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
require("dotenv/config");
exports.ENV = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT || 3001),
    LOG_DIR: process.env.LOG_DIR || 'logs',
    // API override (external)
    CUSTOM_API_ENDPOINT: process.env.CUSTOM_API_ENDPOINT || '',
    CUSTOM_API_KEY: process.env.CUSTOM_API_KEY || '',
    // CORS
    CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
};
//# sourceMappingURL=env.js.map