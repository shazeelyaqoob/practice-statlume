import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { PublicUser, Role } from '@statlume/shared';
import type { Pool } from '../db/pool.ts';
import { forbidden, unauthorized } from '../http.ts';
import { findUserById } from './service.ts';
import { ACCESS_COOKIE, verifyAccessToken } from './tokens.ts';

declare global {
  // Express exposes its request type for extension only through this namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

/**
 * Checks the access token, then loads the user from the database. The extra
 * lookup (a primary key read) means a deleted user or a changed role takes
 * effect on the next request, not when the 15 minute token runs out.
 */
export function requireAuth(pool: Pool, accessSecret: string): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token: unknown = req.cookies?.[ACCESS_COOKIE];
    const userId = typeof token === 'string' ? verifyAccessToken(token, accessSecret) : null;
    if (!userId) throw unauthorized();
    const user = await findUserById(pool, userId);
    if (!user) throw unauthorized();
    req.user = user;
    next();
  };
}

/** Pure role check: an admin can do everything a viewer can. */
export function hasRole(user: Pick<PublicUser, 'role'> | undefined, role: Role): boolean {
  if (!user) return false;
  if (role === 'viewer') return user.role === 'viewer' || user.role === 'admin';
  return user.role === 'admin';
}

export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw unauthorized();
    if (!hasRole(req.user, role)) throw forbidden('Only admins can do this');
    next();
  };
}

/**
 * CSRF guard for cookie-authenticated writes. SameSite=Lax already blocks most
 * cross-site POSTs; this also rejects any request whose Origin is not ours.
 */
export function sameOrigin(allowedOrigin: string): RequestHandler {
  return (req, _res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    const origin = req.get('origin');
    if (origin && origin !== allowedOrigin) throw forbidden('Cross-site request blocked');
    next();
  };
}
