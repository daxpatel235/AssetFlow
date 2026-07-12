import { z } from 'zod';

// Validate environment once, at startup. Fail loud in production if a secret is
// missing; allow a dev default locally so `npm run dev` just works.
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16).default('dev_secret_change_me_in_production'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // In production a bad env is fatal; in dev/build we log and continue.
  console.error('❌ Invalid environment:', parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === 'production') throw new Error('Invalid environment configuration');
}

export const env = parsed.success
  ? parsed.data
  : { DATABASE_URL: process.env.DATABASE_URL ?? '', JWT_SECRET: 'dev_secret_change_me_in_production', NODE_ENV: 'development' as const };

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev_secret_change_me_in_production') {
  throw new Error('JWT_SECRET must be set in production');
}
