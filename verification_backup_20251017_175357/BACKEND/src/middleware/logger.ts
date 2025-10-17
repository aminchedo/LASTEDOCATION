import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import { ENV } from '../config/env';

const dir = path.resolve(process.cwd(), ENV.LOG_DIR);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Create logger with proper configuration to avoid sonic-boom issues
const logConfig = {
  level: ENV.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { service: 'persian-chat-backend' },
  transport: ENV.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
};

// Use file destination only in production, stdout in development
const destination = ENV.NODE_ENV === 'production'
  ? pino.destination(path.join(dir, 'api.log'))
  : undefined;

export const logger = destination
  ? pino(logConfig, destination)
  : pino(logConfig);
