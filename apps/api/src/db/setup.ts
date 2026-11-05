import type { RowDataPacket } from 'mysql2/promise';
import { STORE_TZ, storeToday } from '@statlume/shared';
import { migrate } from './migrate.ts';
import { createPool } from './pool.ts';
import { printPasswords, seed } from './seed.ts';

/**
 * Runs migrations, then makes sure the demo store has a year of orders that
 * ends today.
 *
 * - Empty database: seed everything, including the two demo accounts.
 * - Data that does not reach today: rebuild the store data so it ends today,
 *   keeping users. The fixed random seed and real calendar dates mean the
 *   shape (holiday rush, quiet January) stays the same; only the window moves.
 *
 * Set SEED_END_DATE to pin the data to a fixed day instead.
 */
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = createPool(url, { multipleStatements: true });
try {
  await migrate(pool);
  const pinned = process.env.SEED_END_DATE || undefined;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n,
            DATE_FORMAT(CONVERT_TZ(MAX(created_at), 'UTC', ?), '%Y-%m-%d') AS last_day
     FROM orders`,
    [STORE_TZ],
  );
  const count = Number(rows[0]?.n ?? 0);
  const lastDay = rows[0]?.last_day as string | null;

  if (count === 0) {
    console.log('empty database, seeding a year of store data...');
    const result = await seed(pool, { endDate: pinned });
    printPasswords(result.passwords);
  } else if (!pinned && lastDay && lastDay < storeToday()) {
    console.log(`demo data ends on ${lastDay}, moving the year forward to end today...`);
    await seed(pool, { orders: count, keepUsers: true });
  }
} finally {
  await pool.end();
}
