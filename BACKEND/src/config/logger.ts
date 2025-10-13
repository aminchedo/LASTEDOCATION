import winston from 'winston';
// @ts-ignore - No types available for winston-daily-rotate-file
import DailyRotateFile from 'winston-daily-rotate-file';
import { ENV } from './env';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Custom format for console (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${
      info.metadata ? '\n' + JSON.stringify(info.metadata, null, 2) : ''
    }`
  )
);

// JSON format for files (production)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

// Transports
const transports: winston.transport[] = [];

// Console transport (always)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: ENV.NODE_ENV === 'production' ? 'info' : 'debug',
  })
);

// File transports (production)
if (ENV.NODE_ENV === 'production') {
  // Error logs - daily rotation
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    })
  );

  // Combined logs - daily rotation
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );

  // HTTP logs - daily rotation
  transports.push(
    new DailyRotateFile({
      filename: 'logs/http-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    })
  );
}

// Create logger
export const logger = winston.createLogger({
  levels,
  transports,
  exitOnError: false,
});

// Stream for Morgan (HTTP logging)
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Typed logging methods
export const log = {
  error: (message: string, meta?: Record<string, any>) => {
    logger.error(message, { metadata: meta });
  },
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, { metadata: meta });
  },
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, { metadata: meta });
  },
  http: (message: string, meta?: Record<string, any>) => {
    logger.http(message, { metadata: meta });
  },
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, { metadata: meta });
  },
};
