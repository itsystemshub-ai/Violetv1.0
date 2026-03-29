/**
 * Violet ERP - Sistema de Logging con Winston
 * 
 * Reemplazo para logs de Docker
 * Logs estructurados, rotación, múltiples destinos
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Formatos personalizados
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Crear logger
export function createLogger(module = 'main') {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: logFormat,
    defaultMeta: { module },
    transports: [
      // Console
      new winston.transports.Console({
        format: consoleFormat,
      }),
      
      // Error file
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
      
      // Combined file
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/combined.log'),
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
      
      // Debug file (solo desarrollo)
      ...(process.env.NODE_ENV === 'development' ? [
        new winston.transports.File({
          filename: path.join(__dirname, '../../logs/debug.log'),
          level: 'debug',
          maxsize: 10485760,
          maxFiles: 3,
        }),
      ] : []),
    ],
  });

  return logger;
}

// Logger por defecto
export const logger = createLogger();

export default logger;
