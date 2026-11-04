import 'server-only';
import { cookies } from 'next/headers';
import type { Role } from '@statlume/shared';

/**
 * Reads the role from the access token WITHOUT verifying it. Only used to
 * decide what navigation to show. Every API route checks the token properly,
 * so a forged cookie can show a link but never any data.
 */
export async function sessionRole(): Promise<Role | null> {
  const token = (await cookies()).get('sl_access')?.value;
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.role === 'admin' || payload?.role === 'viewer' ? payload.role : null;
}

export function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
  } catch {
    return null;
  }
}
