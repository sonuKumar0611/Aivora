import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  OPENAI_API_KEY: z.string().optional(), // required only for knowledge/chat
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  /** Public URL of this API (for OAuth redirect_uri). Defaults to http://localhost:4000 in dev. */
  API_PUBLIC_URL: z.string().url().optional(),
  EMAIL_SENDER: z.string().email().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  /** Google OAuth for Calendar/Sheets integrations */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
