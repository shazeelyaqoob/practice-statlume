import mysql from 'mysql2/promise';
import type { Pool, PoolOptions } from 'mysql2/promise';

export type { Pool };

export function createPool(url: string, extra: PoolOptions = {}): Pool {
  return mysql.createPool({
    uri: url,
    connectionLimit: 10,
    // Every DATETIME column is UTC. Return them as plain strings so nothing
    // gets shifted by the Node process time zone.
    timezone: 'Z',
    dateStrings: true,
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
    ...extra,
  });
}

let shared: Pool | undefined;

/** The app-wide pool, created on first use. */
export function getPool(): Pool {
  if (!shared) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    shared = createPool(url);
  }
  return shared;
}
