"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
// JSON-ish line logging for request summaries
exports.requestLogger = (0, morgan_1.default)((tokens, req, res) => {
    const out = {
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: tokens.status(req, res),
        response_time_ms: Number(tokens['response-time'](req, res) || 0),
        content_length: tokens.res(req, res, 'content-length'),
        date: tokens.date(req, res, 'iso'),
    };
    return JSON.stringify(out);
});
//# sourceMappingURL=requestLogger.js.map