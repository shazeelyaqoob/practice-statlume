import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Router, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { CHANNELS, ORDER_STATUSES, PRODUCT_SORTS, dateRangeSchema } from '@statlume/shared';
import type { PoolConnection } from 'mysql2';
import type { Pool } from '../db/pool.ts';
import { parse } from '../http.ts';
import { ordersExportSql, products, topCustomers } from '../reports/queries.ts';
import { csvLine, exportFileName } from './csv.ts';

const ordersExportSchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    channel: z.enum(CHANNELS).optional(),
  })
  .and(dateRangeSchema);

const productsExportSchema = z
  .object({
    sort: z.enum(PRODUCT_SORTS).default('revenue'),
    dir: z.enum(['asc', 'desc']).default('desc'),
    q: z.string().trim().max(80).optional(),
  })
  .and(dateRangeSchema);

const UTF8_BOM = String.fromCharCode(0xfeff);

function startCsv(res: Response, name: string, header: string[]) {
  res.status(200);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.setHeader('Cache-Control', 'no-store');
  // UTF-8 byte order mark so Excel reads accented names correctly.
  res.write(`${UTF8_BOM}${csvLine(header)}`);
}

export function exportRouter(pool: Pool, opts: { rateLimit?: boolean } = {}): Router {
  const router = Router();
  router.use(
    rateLimit({
      windowMs: 60_000,
      limit: 10,
      keyGenerator: (req) => `user:${req.user?.id ?? 'anon'}`,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skip: () => opts.rateLimit === false,
      message: { error: { code: 'rate_limited', message: 'Too many exports. Wait a minute.' } },
    }),
  );

  /**
   * Streams every matching order straight from MySQL to the browser. Rows are
   * read from the socket as they arrive (mysql2 query stream) and written in
   * chunks, with backpressure from pipeline(), so memory stays flat even for
   * 500k orders.
   */
  router.get('/orders.csv', async (req, res) => {
    const q = parse(ordersExportSchema, req.query);
    const { sql, params } = ordersExportSql(q);
    const header = [
      'order_number',
      'created_at_et',
      'customer',
      'email',
      'channel',
      'status',
      'items',
      'subtotal',
      'discount',
      'total',
    ];
    // The promise API has no stream(), so take a connection from the
    // underlying callback pool for this one query.
    const conn = await new Promise<PoolConnection>((resolve, reject) =>
      pool.pool.getConnection((err, c) => (err ? reject(err) : resolve(c))),
    );
    try {
      const rows = conn.query({ sql, values: params }).stream({ highWaterMark: 500 });
      startCsv(res, exportFileName('orders', q.from, q.to), header);
      const toCsv = new Transform({
        writableObjectMode: true,
        transform(row: Record<string, unknown>, _enc, done) {
          done(null, csvLine(header.map((h) => row[h])));
        },
      });
      await pipeline(rows, toCsv, res);
    } finally {
      conn.release();
    }
  });

  router.get('/products.csv', async (req, res) => {
    const q = parse(productsExportSchema, req.query);
    const rows = await products(pool, q);
    startCsv(res, exportFileName('products', q.from, q.to), [
      'product',
      'category',
      'units_sold',
      'net_revenue',
      'refunded_units',
      'share_of_revenue_pct',
    ]);
    await pipeline(
      Readable.from(
        rows.map((r) => csvLine([r.title, r.category, r.units, r.revenue, r.refunds, r.share])),
      ),
      res,
    );
  });

  router.get('/customers.csv', async (req, res) => {
    const q = parse(dateRangeSchema, req.query);
    const rows = await topCustomers(pool, q.from, q.to);
    startCsv(res, exportFileName('customers', q.from, q.to), [
      'customer',
      'email',
      'orders',
      'net_revenue',
      'last_order_utc',
    ]);
    await pipeline(
      Readable.from(
        rows.map((r) => csvLine([r.name, r.email, r.orders, r.revenue, r.lastOrderAt])),
      ),
      res,
    );
  });

  return router;
}
