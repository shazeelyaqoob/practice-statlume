import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { createPool, type Pool } from './pool.ts';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations/', import.meta.url));

/**
 * Applies every `NNN_name.sql` file in order, once. Applied files are recorded
 * in `schema_migrations`. Pass `upTo` to stop before a later migration (used to
 * measure the index story without the index).
 */
export async function migrate(
  pool: Pool,
  opts: { upTo?: string; log?: boolean } = {},
): Promise<string[]> {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(190) NOT NULL PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  const [rows] = await pool.query<RowDataPacket[]>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name as string));

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();

  const ran: string[] = [];
  for (const file of files) {
    if (opts.upTo && file > opts.upTo) break;
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const conn = await pool.getConnection();
    try {
      // The pool must be created with `multipleStatements: true` (see createPool callers).
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
    } finally {
      conn.release();
    }
    if (opts.log !== false) console.log(`migrated ${file}`);
    ran.push(file);
  }
  return ran;
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const pool = createPool(url, { multipleStatements: true });
  const ran = await migrate(pool, { upTo: process.argv[2] });
  if (ran.length === 0) console.log('database is up to date');
  await pool.end();
}
