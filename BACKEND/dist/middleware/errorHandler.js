"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("./logger");
function errorHandler(err, _req, res, _next) {
    const status = err.statusCode || err.status || 500;
    const payload = {
        error: true,
        message: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
    };
    logger_1.logger.error({ msg: 'Unhandled error', status, err: err?.stack || err });
    res.status(status).json(payload);
}
//# sourceMappingURL=errorHandler.js.map