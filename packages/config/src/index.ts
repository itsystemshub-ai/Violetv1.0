/**
 * @violet/config
 * Shared configuration for Violet ERP
 */

import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Stitch
  VITE_STITCH_MODE: z.string().default('premium'),
  VITE_STITCH_HUD_ENABLED: z.string().default('true'),
  
  // n8n
  VITE_N8N_WEBHOOK_URL: z.string().url().optional(),
  VITE_N8N_API_KEY: z.string().optional(),
  
  // Resend (Email)
  VITE_RESEND_API_KEY: z.string().optional(),
  
  // CallMeBot (WhatsApp)
  VITE_CALLMEBOT_APIKEY: z.string().optional(),
  
  // AI Providers
  VITE_GROQ_API_KEY: z.string().optional(),
  VITE_GEMINI_API_KEY: z.string().optional(),
  VITE_HUGGINGFACE_API_KEY: z.string().optional(),
  
  // Security
  VITE_JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().default('12'),
  
  // Demo
  VITE_ENABLE_MOCK_USERS: z.string().default('true'),
  VITE_SUPER_ADMIN_USER: z.string().default('superadmin'),
  VITE_SUPER_ADMIN_PASS: z.string().default('Violet@2026!'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// App configuration
export const appConfig = {
  name: 'Violet ERP',
  version: '1.0.0',
  description: 'Next Generation Enterprise Resource Planning',
} as const;

// Server configuration
export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
} as const;

// Database configuration
export const databaseConfig = {
  client: 'sqlite',
  connection: {
    filename: './violet_erp.db',
  },
  useNullAsDefault: true,
} as const;

// API configuration
export const apiConfig = {
  baseUrl: process.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
} as const;

// AI configuration
export const aiConfig = {
  providers: {
    groq: {
      enabled: !!process.env.VITE_GROQ_API_KEY,
      apiKey: process.env.VITE_GROQ_API_KEY || '',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      maxTokens: 1024,
    },
    gemini: {
      enabled: !!process.env.VITE_GEMINI_API_KEY,
      apiKey: process.env.VITE_GEMINI_API_KEY || '',
      model: 'gemini-2.0-flash',
      temperature: 0.3,
      maxTokens: 2048,
    },
    huggingface: {
      enabled: !!process.env.VITE_HUGGINGFACE_API_KEY,
      apiKey: process.env.VITE_HUGGINGFACE_API_KEY || '',
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      temperature: 0.5,
      maxTokens: 512,
    },
  },
  defaultProvider: 'groq',
} as const;

// Feature flags
export const featureFlags = {
  enableAI: true,
  enableSync: true,
  enableMultiTenant: true,
  enableMockUsers: process.env.VITE_ENABLE_MOCK_USERS === 'true',
  enableStitchHUD: process.env.VITE_STITCH_HUD_ENABLED === 'true',
} as const;

// Validation
export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .filter(e => e.code === 'invalid_type')
        .map(e => e.path.join('.'));
      
      throw new Error(
        `Missing or invalid environment variables: ${missing.join(', ')}`
      );
    }
    throw error;
  }
}

// Export validated config
export const env = validateEnv();

// Export all configs
export default {
  app: appConfig,
  server: serverConfig,
  database: databaseConfig,
  api: apiConfig,
  ai: aiConfig,
  features: featureFlags,
  env,
};
