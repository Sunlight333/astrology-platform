import { config } from 'dotenv';
import { z } from 'zod';

config(); // Load .env file

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  DATABASE_URL: z.string(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  GOOGLE_MAPS_API_KEY: z.string().optional(),
  OPENCAGE_API_KEY: z.string().optional(),

  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_PUBLIC_KEY: z.string().optional(),

  FRONTEND_URL: z.string().default('http://localhost:5173'),

  EPHEMERIS_PATH: z.string().default('./data/ephe'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
