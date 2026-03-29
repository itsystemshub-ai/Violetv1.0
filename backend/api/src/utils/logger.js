/**
 * Violet ERP - Advanced Logger with Winston
 * Logging estructurado con rotación de archivos y múltiples destinos
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Formatos personalizados
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Transportes
const transports = [
  // Console
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'debug',
    format: consoleFormat,
  }),

  // Daily rotate - Error logs
  new winston.transports.DailyRotateFile({
    level: 'error',
    dirname: path.join(__dirname, '../../logs'),
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '30d',
    format: logFormat,
  }),

  // Daily rotate - Combined logs
  new winston.transports.DailyRotateFile({
    level: 'debug',
    dirname: path.join(__dirname, '../../logs'),
    filename: 'combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat,
  }),

  // HTTP requests log
  new winston.transports.DailyRotateFile({
    level: 'http',
    dirname: path.join(__dirname, '../../logs'),
    filename: 'http-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '50m',
    maxFiles: '14d',
    format: logFormat,
  }),
];

// Crear logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: logFormat,
  transports,
  defaultMeta: {
    service: 'violet-erp-api',
    version: process.env.APP_VERSION || '2.0.0',
  },
});

// Logger middleware para Express
export const httpLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};

// Context logger - añade contexto adicional
export const createLogger = (context) => {
  return {
    debug: (message, meta) => logger.debug({ context, message, ...meta }),
    info: (message, meta) => logger.info({ context, message, ...meta }),
    warn: (message, meta) => logger.warn({ context, message, ...meta }),
    error: (message, meta) => logger.error({ context, message, ...meta }),
  };
};

export default logger;
