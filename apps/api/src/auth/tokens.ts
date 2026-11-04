import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@statlume/shared';

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
/**
 * A refresh token used again within this many seconds of being rotated is
 * treated as a race (two tabs refreshing at once), not as theft.
 */
export const REUSE_GRACE_SECONDS = 20;

export const ACCESS_COOKIE = 'sl_access';
export const REFRESH_COOKIE = 'sl_refresh';

const ISSUER = 'statlume';

export interface AccessClaims {
  sub: string;
  role: Role;
}

export function signAccessToken(userId: number, role: Role, secret: string): string {
  return jwt.sign({ role } satisfies Omit<AccessClaims, 'sub'>, secret, {
    algorithm: 'HS256',
    subject: String(userId),
    issuer: ISSUER,
    expiresIn: ACCESS_TTL_SECONDS,
  });
}

/** Returns the user id, or null for a missing, expired or forged token. */
export function verifyAccessToken(token: string, secret: string): number | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: ISSUER });
    if (typeof payload === 'string' || !payload.sub) return null;
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/** A new opaque refresh token. Only its hash is stored. */
export function newRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * HMAC with a server-side pepper, so a leaked database dump alone cannot be
 * used to forge cookies. Refresh tokens are random, so a fast hash is fine
 * (unlike passwords).
 */
export function hashRefreshToken(token: string, pepper: string): string {
  return createHmac('sha256', pepper).update(token).digest('hex');
}

export const newFamilyId = () => randomUUID();
