"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (msg) => {
        try {
            if (typeof msg === 'string') {
                console.log(`[INFO] ${msg}`);
            }
            else {
                console.log('[INFO]', JSON.stringify(msg, null, 2));
            }
        }
        catch { }
    },
    error: (msg) => {
        try {
            if (typeof msg === 'string') {
                console.error(`[ERROR] ${msg}`);
            }
            else {
                console.error('[ERROR]', JSON.stringify(msg, null, 2));
            }
        }
        catch { }
    },
    debug: (msg) => {
        try {
            if (typeof msg === 'string') {
                console.debug(`[DEBUG] ${msg}`);
            }
            else {
                console.debug('[DEBUG]', JSON.stringify(msg, null, 2));
            }
        }
        catch { }
    },
    warn: (msg) => {
        try {
            if (typeof msg === 'string') {
                console.warn(`[WARN] ${msg}`);
            }
            else {
                console.warn('[WARN]', JSON.stringify(msg, null, 2));
            }
        }
        catch { }
    },
};
//# sourceMappingURL=logger.js.map