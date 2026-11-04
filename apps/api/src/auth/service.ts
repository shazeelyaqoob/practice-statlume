import argon2 from 'argon2';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PublicUser, Role } from '@statlume/shared';
import type { Pool } from '../db/pool.ts';
import { unauthorized } from '../http.ts';
import {
  REFRESH_TTL_SECONDS,
  REUSE_GRACE_SECONDS,
  hashRefreshToken,
  newFamilyId,
  newRefreshToken,
  signAccessToken,
} from './tokens.ts';

export interface AuthSecrets {
  accessSecret: string;
  pepper: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  created_at: string;
}

export function toPublicUser(row: Omit<UserRow, 'password_hash'>): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: `${row.created_at.replace(' ', 'T')}Z`,
  };
}

// A real argon2 hash of a random string. Verifying against it when the email
// does not exist keeps the response time the same, so attackers cannot tell
// which emails have accounts.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= argon2.hash('statlume-timing-equaliser'));

export async function findUserById(pool: Pool, id: number): Promise<PublicUser | null> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
    [id],
  );
  return rows[0] ? toPublicUser(rows[0]) : null;
}

async function insertRefreshToken(
  db: Pool | PoolConnection,
  userId: number,
  familyId: string,
  pepper: string,
): Promise<string> {
  const token = newRefreshToken();
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
     VALUES (?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? SECOND)`,
    [userId, hashRefreshToken(token, pepper), familyId, REFRESH_TTL_SECONDS],
  );
  return token;
}

async function issue(pool: Pool, user: PublicUser, secrets: AuthSecrets): Promise<IssuedTokens> {
  const refreshToken = await insertRefreshToken(pool, user.id, newFamilyId(), secrets.pepper);
  return {
    accessToken: signAccessToken(user.id, user.role, secrets.accessSecret),
    refreshToken,
    user,
  };
}

export async function login(
  pool: Pool,
  email: string,
  password: string,
  secrets: AuthSecrets,
): Promise<IssuedTokens> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ?',
    [email],
  );
  const row = rows[0];
  const ok = await argon2.verify(row?.password_hash ?? (await getDummyHash()), password);
  if (!row || !ok) throw unauthorized('Email or password is wrong');
  return issue(pool, toPublicUser(row), secrets);
}

/** Logs in one of the seeded demo accounts without a password. */
export async function demoLogin(pool: Pool, role: Role, secrets: AuthSecrets) {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, email, name, role, created_at FROM users
     WHERE is_demo = 1 AND role = ? ORDER BY id LIMIT 1`,
    [role],
  );
  if (!rows[0]) throw unauthorized('Demo account not found. Run the seed script.');
  return issue(pool, toPublicUser(rows[0]), secrets);
}

interface TokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  family_id: string;
  revoke_reason: 'rotated' | 'logout' | 'reuse' | null;
  expired: 0 | 1;
  revoked_ago: number | null;
}

export type RefreshResult =
  | { ok: true; tokens: IssuedTokens }
  | { ok: false; reason: 'unknown' | 'expired' | 'reused' | 'user_gone' };

/**
 * Refresh token rotation with reuse detection.
 *
 * Every refresh token works once. Using it revokes it and returns a new one in
 * the same family. If a revoked token shows up again later, someone has a copy
 * of it (stolen cookie), so every session of that user is revoked.
 *
 * The row is locked with SELECT ... FOR UPDATE so two refreshes of the same
 * token are handled one after the other, never at the same time.
 */
export async function rotateRefreshToken(
  pool: Pool,
  token: string,
  secrets: AuthSecrets,
): Promise<RefreshResult> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<TokenRow[]>(
      `SELECT id, user_id, family_id, revoke_reason,
              expires_at <= UTC_TIMESTAMP() AS expired,
              TIMESTAMPDIFF(SECOND, revoked_at, UTC_TIMESTAMP()) AS revoked_ago
       FROM refresh_tokens WHERE token_hash = ? FOR UPDATE`,
      [hashRefreshToken(token, secrets.pepper)],
    );
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return { ok: false, reason: 'unknown' };
    }
    if (row.expired) {
      await conn.rollback();
      return { ok: false, reason: 'expired' };
    }
    if (row.revoke_reason === 'logout' || row.revoke_reason === 'reuse') {
      // Ended on purpose. Never revive it, not even inside the grace window.
      await conn.rollback();
      return { ok: false, reason: 'expired' };
    }
    if (row.revoke_reason === 'rotated' && (row.revoked_ago ?? 0) > REUSE_GRACE_SECONDS) {
      // A token that was already swapped for a new one is back: someone else
      // has a copy. End every session of this user.
      await conn.query(
        `UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP(), revoke_reason = 'reuse'
         WHERE user_id = ? AND revoked_at IS NULL`,
        [row.user_id],
      );
      await conn.commit();
      return { ok: false, reason: 'reused' };
    }
    if (row.revoke_reason === null) {
      await conn.query(
        `UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP(), revoke_reason = 'rotated'
         WHERE id = ?`,
        [row.id],
      );
    }
    // Otherwise: rotated within the last few seconds (two tabs refreshing at
    // once). Issue another token in the same family instead of logging out.
    const [users] = await conn.query<UserRow[]>(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      [row.user_id],
    );
    if (!users[0]) {
      await conn.rollback();
      return { ok: false, reason: 'user_gone' };
    }
    const refreshToken = await insertRefreshToken(conn, row.user_id, row.family_id, secrets.pepper);
    await conn.commit();
    const user = toPublicUser(users[0]);
    return {
      ok: true,
      tokens: {
        accessToken: signAccessToken(user.id, user.role, secrets.accessSecret),
        refreshToken,
        user,
      },
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function revokeRefreshToken(pool: Pool, token: string, pepper: string) {
  await pool.query<ResultSetHeader>(
    `UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP(), revoke_reason = 'logout'
     WHERE token_hash = ? AND revoked_at IS NULL`,
    [hashRefreshToken(token, pepper)],
  );
}
