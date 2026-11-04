import type { RowDataPacket } from 'mysql2/promise';
import { migrate } from './migrate.ts';
import { createPool } from './pool.ts';
import { printPasswords, seed } from './seed.ts';

/** Runs migrations, then seeds the database if it has no orders yet. */
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = createPool(url, { multipleStatements: true });
try {
  await migrate(pool);
  const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM orders');
  if (Number(rows[0]?.n) === 0) {
    console.log('empty database, seeding a year of store data...');
    const result = await seed(pool, { endDate: process.env.SEED_END_DATE || undefined });
    printPasswords(result.passwords);
  }
} finally {
  await pool.end();
}
