/**
 * Index benchmark behind docs/INDEX_STORY.md.
 *
 *   pnpm --filter @statlume/api bench            (500,000 orders)
 *   pnpm --filter @statlume/api bench -- --orders 200000
 *
 * Uses a separate `statlume_bench` database so the app data is not touched.
 * Seeds it, then times the "revenue by day" query with no extra index and
 * with each candidate index, and prints EXPLAIN ANALYZE for each.
 */
import { parseArgs } from 'node:util';
import { performance } from 'node:perf_hooks';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2/promise';
import { addDays } from '@statlume/shared';
import { migrate } from './migrate.ts';
import { createPool } from './pool.ts';
import { seed } from './seed.ts';
import {
  COUNTED,
  REFUNDS_BY_ORDER,
  bucketExpr,
  bucketParams,
  rangeParams,
  rangeWhere,
} from '../reports/sql.ts';

const { values } = parseArgs({
  options: {
    orders: { type: 'string', default: '500000' },
    runs: { type: 'string', default: '7' },
    'end-date': { type: 'string', default: '2026-11-03' },
  },
});
const ORDERS = Number(values.orders);
const RUNS = Number(values.runs);
const END = values['end-date'];

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) throw new Error('DATABASE_URL is not set');
const benchUrl = baseUrl.replace(/\/[^/?]+(\?|$)/, '/statlume_bench$1');

/** The query the Overview chart runs: net revenue and orders per day. */
function revenueByDaySql(from: string, to: string): string {
  return mysql.format(
    `SELECT ${bucketExpr('o.created_at', 'day')} AS bucket,
            COUNT(*) AS orders,
            SUM(o.total - COALESCE(r.amount, 0)) AS revenue
     FROM orders o
     LEFT JOIN ${REFUNDS_BY_ORDER} r ON r.order_id = o.id
     WHERE o.status IN ${COUNTED} AND ${rangeWhere('o')}
     GROUP BY bucket
     ORDER BY bucket`,
    [...bucketParams('day'), ...rangeParams(from, to)],
  );
}

const CANDIDATES = [
  { name: 'no extra index', ddl: null },
  {
    name: 'orders(created_at)',
    ddl: 'CREATE INDEX idx_bench ON orders (created_at)',
  },
  {
    name: 'orders(status, created_at)',
    ddl: 'CREATE INDEX idx_bench ON orders (status, created_at)',
  },
  {
    name: 'orders(status, created_at, total)',
    ddl: 'CREATE INDEX idx_bench ON orders (status, created_at, total)',
  },
];

const RANGES = [
  { label: 'last 30 days', from: addDays(END, -29), to: END },
  { label: 'last 12 months', from: addDays(END, -364), to: END },
];

const pool = createPool(benchUrl, { multipleStatements: true });

async function time(sql: string): Promise<{ median: number; rows: number }> {
  await pool.query(sql); // warm up
  const samples: number[] = [];
  let rows = 0;
  for (let i = 0; i < RUNS; i++) {
    const t = performance.now();
    const [r] = await pool.query<RowDataPacket[]>(sql);
    samples.push(performance.now() - t);
    rows = r.length;
  }
  samples.sort((a, b) => a - b);
  return { median: samples[Math.floor(samples.length / 2)] ?? 0, rows };
}

async function explain(sql: string): Promise<string> {
  const [r] = await pool.query<RowDataPacket[]>(`EXPLAIN ANALYZE ${sql}`);
  return String(Object.values(r[0] ?? {})[0] ?? '');
}

try {
  console.log(`seeding ${ORDERS.toLocaleString('en-US')} orders into statlume_bench...`);
  await pool.query(
    'DROP TABLE IF EXISTS refunds, order_items, orders, customers, product_variants, products, refresh_tokens, users, schema_migrations',
  );
  await migrate(pool, { upTo: '001_init.sql', log: false });
  await seed(pool, { orders: ORDERS, endDate: END, now: new Date(`${addDays(END, 1)}T04:00:00Z`) });

  const results: string[] = [];
  for (const c of CANDIDATES) {
    await pool.query('DROP INDEX idx_bench ON orders').catch(() => undefined);
    if (c.ddl) await pool.query(c.ddl);
    await pool.query('ANALYZE TABLE orders');
    for (const r of RANGES) {
      const sql = revenueByDaySql(r.from, r.to);
      const { median, rows } = await time(sql);
      results.push(`| ${c.name} | ${r.label} | ${median.toFixed(1)} ms | ${rows} |`);
      console.log(`\n=== ${c.name} / ${r.label}: median ${median.toFixed(1)} ms over ${RUNS} runs`);
      console.log(await explain(sql));
    }
  }
  await pool.query('DROP INDEX idx_bench ON orders').catch(() => undefined);

  const [[v]] = await pool.query<RowDataPacket[]>('SELECT VERSION() AS v');
  console.log(
    `\nMySQL ${v?.v}, ${ORDERS.toLocaleString('en-US')} orders, median of ${RUNS} runs\n`,
  );
  console.log('| Index | Range | Median time | Rows returned |');
  console.log('| --- | --- | --- | --- |');
  console.log(results.join('\n'));
} finally {
  await pool.end();
}
