import { Router, type CookieOptions, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { demoLoginSchema, loginSchema } from '@statlume/shared';
import type { Pool } from '../db/pool.ts';
import { parse, unauthorized } from '../http.ts';
import { requireAuth } from './middleware.ts';
import {
  demoLogin,
  login,
  revokeRefreshToken,
  rotateRefreshToken,
  type AuthSecrets,
  type IssuedTokens,
} from './service.ts';
import {
  ACCESS_COOKIE,
  ACCESS_TTL_SECONDS,
  REFRESH_COOKIE,
  REFRESH_TTL_SECONDS,
} from './tokens.ts';

export interface AuthRouterOptions extends AuthSecrets {
  pool: Pool;
  cookieSecure: boolean;
  /** Set to false to switch rate limiting off. */
  rateLimit?: boolean;
}

const limitResponse = (message: string) => ({ error: { code: 'rate_limited', message } });

export function authRouter(opts: AuthRouterOptions): Router {
  const { pool, cookieSecure } = opts;
  const secrets: AuthSecrets = { accessSecret: opts.accessSecret, pepper: opts.pepper };
  const router = Router();

  const base: CookieOptions = { httpOnly: true, sameSite: 'lax', secure: cookieSecure, path: '/' };
  const setCookies = (res: Response, t: IssuedTokens) => {
    res.cookie(ACCESS_COOKIE, t.accessToken, { ...base, maxAge: ACCESS_TTL_SECONDS * 1000 });
    res.cookie(REFRESH_COOKIE, t.refreshToken, { ...base, maxAge: REFRESH_TTL_SECONDS * 1000 });
  };
  const clearCookies = (res: Response) => {
    res.clearCookie(ACCESS_COOKIE, base);
    res.clearCookie(REFRESH_COOKIE, base);
  };

  const enabled = opts.rateLimit !== false;
  const loginLimiter = rateLimit({
    windowMs: 60_000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => !enabled,
    message: limitResponse('Too many login attempts. Try again in a minute.'),
  });
  const demoLimiter = rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => !enabled,
    message: limitResponse('Too many attempts. Try again in a minute.'),
  });
  const refreshLimiter = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => !enabled,
    message: limitResponse('Too many requests.'),
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = parse(loginSchema, req.body);
    const tokens = await login(pool, email, password, secrets);
    setCookies(res, tokens);
    res.json({ user: tokens.user });
  });

  router.post('/demo', demoLimiter, async (req, res) => {
    const { role } = parse(demoLoginSchema, req.body);
    const tokens = await demoLogin(pool, role, secrets);
    setCookies(res, tokens);
    res.json({ user: tokens.user });
  });

  router.post('/refresh', refreshLimiter, async (req, res) => {
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof token !== 'string' || token.length === 0) throw unauthorized();
    const result = await rotateRefreshToken(pool, token, secrets);
    if (!result.ok) {
      clearCookies(res);
      const message =
        result.reason === 'reused'
          ? 'This session was used from somewhere else, so every session was signed out for safety.'
          : 'Your session has ended. Please log in again.';
      res.status(401).json({ error: { code: `refresh_${result.reason}`, message } });
      return;
    }
    setCookies(res, result.tokens);
    res.json({ user: result.tokens.user });
  });

  router.post('/logout', async (req, res) => {
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof token === 'string' && token) await revokeRefreshToken(pool, token, secrets.pepper);
    clearCookies(res);
    res.status(204).end();
  });

  router.get('/me', requireAuth(pool, secrets.accessSecret), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
