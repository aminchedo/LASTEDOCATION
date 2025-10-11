"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pino_1 = __importDefault(require("pino"));
const env_1 = require("../config/env");
const dir = path_1.default.resolve(process.cwd(), env_1.ENV.LOG_DIR);
if (!fs_1.default.existsSync(dir))
    fs_1.default.mkdirSync(dir, { recursive: true });
// Create logger with proper configuration to avoid sonic-boom issues
const logConfig = {
    level: env_1.ENV.NODE_ENV === 'production' ? 'info' : 'debug',
    base: { service: 'persian-chat-backend' },
    transport: env_1.ENV.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    } : undefined
};
// Use file destination only in production, stdout in development
const destination = env_1.ENV.NODE_ENV === 'production'
    ? pino_1.default.destination(path_1.default.join(dir, 'api.log'))
    : undefined;
exports.logger = destination
    ? (0, pino_1.default)(logConfig, destination)
    : (0, pino_1.default)(logConfig);
//# sourceMappingURL=logger.js.map