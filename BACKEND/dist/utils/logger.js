"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (msg) => { try {
        console.log(msg);
    }
    catch { } },
    error: (msg) => { try {
        console.error(msg);
    }
    catch { } },
    debug: (msg) => { try {
        console.debug(msg);
    }
    catch { } },
    warn: (msg) => { try {
        console.warn(msg);
    }
    catch { } },
};
//# sourceMappingURL=logger.js.map