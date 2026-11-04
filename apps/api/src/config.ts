import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_PEPPER: z.string().min(32, 'REFRESH_TOKEN_PEPPER must be at least 32 characters'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Config = z.infer<typeof envSchema>;

let cached: Config | undefined;

export function config(): Config {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
      throw new Error(`Invalid environment:\n${issues.join('\n')}`);
    }
    cached = parsed.data;
  }
  return cached;
}
