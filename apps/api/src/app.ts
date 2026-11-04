import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Pool } from './db/pool.ts';
import { requireAuth, requireRole, sameOrigin } from './auth/middleware.ts';
import { authRouter } from './auth/routes.ts';
import { exportRouter } from './export/routes.ts';
import { errorHandler, notFound } from './http.ts';
import { reportsRouter } from './reports/routes.ts';
import { usersRouter } from './users/routes.ts';

export interface AppOptions {
  pool: Pool;
  accessSecret: string;
  pepper: string;
  webOrigin: string;
  cookieSecure: boolean;
  rateLimit?: boolean;
}

export function createApp(opts: AppOptions): Express {
  const { pool } = opts;
  const app = express();

  // The API sits behind the Next.js server (one hop), which sets X-Forwarded-For.
  // Trusting exactly one hop gives rate limiting the real client IP.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  // No CORS middleware on purpose: the browser only ever calls the API through
  // the web app's own origin (/api rewrite), so cross-origin reads stay blocked.
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());
  app.use(sameOrigin(opts.webOrigin));

  const api = express.Router();
  api.get('/health', async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  });
  api.use(
    '/auth',
    authRouter({
      pool,
      accessSecret: opts.accessSecret,
      pepper: opts.pepper,
      cookieSecure: opts.cookieSecure,
      rateLimit: opts.rateLimit,
    }),
  );

  const auth = requireAuth(pool, opts.accessSecret);
  api.use('/export', auth, exportRouter(pool, { rateLimit: opts.rateLimit }));
  api.use('/users', auth, requireRole('admin'), usersRouter(pool));
  api.use(auth, reportsRouter(pool));

  app.use('/api', api);
  app.use(() => {
    throw notFound('No such route');
  });
  app.use(errorHandler);
  return app;
}
