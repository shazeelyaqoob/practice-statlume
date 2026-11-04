import { createApp } from './app.ts';
import { config } from './config.ts';
import { getPool } from './db/pool.ts';

const cfg = config();
const pool = getPool();
const app = createApp({
  pool,
  accessSecret: cfg.JWT_ACCESS_SECRET,
  pepper: cfg.REFRESH_TOKEN_PEPPER,
  webOrigin: cfg.WEB_ORIGIN,
  cookieSecure: cfg.COOKIE_SECURE,
});

const server = app.listen(cfg.PORT, () => {
  console.log(`statlume api listening on http://localhost:${cfg.PORT}`);
});

const shutdown = () => {
  server.close(() => void pool.end().then(() => process.exit(0)));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
