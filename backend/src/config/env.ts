/**
 * Environment Configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  DB_PATH: z.string().default('./data/violet.db'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  LOG_LEVEL: z.string().default('info'),
  LOG_FILE: z.string().default('./logs/app.log'),
  SSL_ENABLED: z.string().transform(v => v === 'true').default('false'),
  SSL_KEY_PATH: z.string().default('./ssl/private.key'),
  SSL_CERT_PATH: z.string().default('./ssl/certificate.crt'),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_EMAIL: z.string().email().default('admin@violet-erp.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  host: parsed.data.HOST,
  corsOrigin: parsed.data.CORS_ORIGIN.split(','),
  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  bcrypt: {
    rounds: parsed.data.BCRYPT_ROUNDS,
  },
  database: {
    path: parsed.data.DB_PATH,
  },
  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    maxRequests: parsed.data.RATE_LIMIT_MAX_REQUESTS,
  },
  logging: {
    level: parsed.data.LOG_LEVEL,
    file: parsed.data.LOG_FILE,
  },
  ssl: {
    enabled: parsed.data.SSL_ENABLED,
    keyPath: parsed.data.SSL_KEY_PATH,
    certPath: parsed.data.SSL_CERT_PATH,
  },
  admin: {
    username: parsed.data.ADMIN_USERNAME,
    password: parsed.data.ADMIN_PASSWORD,
    email: parsed.data.ADMIN_EMAIL,
  },
} as const;
