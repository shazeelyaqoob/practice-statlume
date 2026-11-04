import type { RowDataPacket } from 'mysql2/promise';
import {
  STORE_TZ,
  defaultInterval,
  percentChange,
  previousPeriod,
  type CustomersResponse,
  type Interval,
  type KpisResponse,
  type OrderRow,
  type OrdersQuery,
  type OrdersResponse,
  type ProductRow,
  type ProductsQuery,
  type SalesPoint,
  type SalesResponse,
  type TopCustomerRow,
} from '@statlume/shared';
import type { Pool } from '../db/pool.ts';
import {
  COUNTED,
  REFUNDS_BY_ORDER,
  bucketExpr,
  bucketList,
  bucketParams,
  likeContains,
  rangeParams,
  rangeWhere,
  round2,
} from './sql.ts';

type Rows = RowDataPacket[];

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

interface Totals {
  revenue: number;
  orders: number;
  customers: number;
  returning: number;
}

/**
 * Net revenue and order count for a range. Revenue is order totals minus
 * refunds, so a refunded order adds nothing.
 */
export async function salesTotals(pool: Pool, from: string, to: string): Promise<Totals> {
  const [[sales], [cust]] = await Promise.all([
    pool.query<Rows>(
      `SELECT COUNT(*) AS orders,
              COALESCE(SUM(o.total - COALESCE(r.amount, 0)), 0) AS revenue
       FROM orders o
       LEFT JOIN ${REFUNDS_BY_ORDER} r ON r.order_id = o.id
       WHERE o.status IN ${COUNTED} AND ${rangeWhere('o')}`,
      rangeParams(from, to),
    ),
    // A customer is "returning" when they had a counted order before the range
    // started. EXISTS stops at the first match and uses the
    // (customer_id, created_at) index, so it stays fast with many customers.
    pool.query<Rows>(
      `SELECT COUNT(*) AS customers,
              COALESCE(SUM(EXISTS (
                SELECT 1 FROM orders p
                WHERE p.customer_id = c.customer_id
                  AND p.status IN ${COUNTED}
                  AND p.created_at < CONVERT_TZ(?, ?, 'UTC')
              )), 0) AS returning_customers
       FROM (
         SELECT DISTINCT o.customer_id FROM orders o
         WHERE o.status IN ${COUNTED} AND ${rangeWhere('o')}
       ) c`,
      [`${from} 00:00:00`, STORE_TZ, ...rangeParams(from, to)],
    ),
  ]);
  return {
    revenue: Number(sales[0]?.revenue ?? 0),
    orders: Number(sales[0]?.orders ?? 0),
    customers: Number(cust[0]?.customers ?? 0),
    returning: Number(cust[0]?.returning_customers ?? 0),
  };
}

export async function kpis(pool: Pool, from: string, to: string): Promise<KpisResponse> {
  const prev = previousPeriod(from, to);
  const [cur, old] = await Promise.all([
    salesTotals(pool, from, to),
    salesTotals(pool, prev.from, prev.to),
  ]);
  const aov = (t: Totals) => (t.orders ? t.revenue / t.orders : 0);
  const rate = (t: Totals) => (t.customers ? (t.returning / t.customers) * 100 : 0);
  return {
    range: { from, to },
    previousRange: prev,
    revenue: {
      current: round2(cur.revenue),
      previous: round2(old.revenue),
      change: percentChange(cur.revenue, old.revenue),
    },
    orders: {
      current: cur.orders,
      previous: old.orders,
      change: percentChange(cur.orders, old.orders),
    },
    averageOrderValue: {
      current: round2(aov(cur)),
      previous: round2(aov(old)),
      change: percentChange(aov(cur), aov(old)),
    },
    // For a rate, the change is in percentage points, not percent.
    returningRate: {
      current: round2(rate(cur)),
      previous: round2(rate(old)),
      change: old.customers ? round2(rate(cur) - rate(old)) : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Sales over time
// ---------------------------------------------------------------------------

export async function salesSeries(
  pool: Pool,
  from: string,
  to: string,
  interval: Interval,
): Promise<SalesPoint[]> {
  const bucket = bucketExpr('o.created_at', interval);
  const [rows] = await pool.query<Rows>(
    `SELECT ${bucket} AS bucket,
            COUNT(*) AS orders,
            SUM(o.total - COALESCE(r.amount, 0)) AS revenue
     FROM orders o
     LEFT JOIN ${REFUNDS_BY_ORDER} r ON r.order_id = o.id
     WHERE o.status IN ${COUNTED} AND ${rangeWhere('o')}
     GROUP BY bucket
     ORDER BY bucket`,
    [...bucketParams(interval), ...rangeParams(from, to)],
  );
  const byBucket = new Map(rows.map((r) => [String(r.bucket), r]));
  return bucketList(from, to, interval).map((b) => {
    const r = byBucket.get(b);
    return { bucket: b, orders: Number(r?.orders ?? 0), revenue: round2(Number(r?.revenue ?? 0)) };
  });
}

export async function sales(
  pool: Pool,
  from: string,
  to: string,
  interval: Interval = defaultInterval(from, to),
): Promise<SalesResponse> {
  const prev = previousPeriod(from, to);
  const [current, previous] = await Promise.all([
    salesSeries(pool, from, to, interval),
    salesSeries(pool, prev.from, prev.to, interval),
  ]);
  return { interval, current, previous };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const PRODUCT_SORT_SQL: Record<ProductsQuery['sort'], string> = {
  revenue: 'revenue',
  units: 'units',
  refunds: 'refunds',
  title: 'title',
};

/**
 * Units, net revenue and refunded units per product.
 *
 * Order discounts are spread over the lines by their share of the subtotal
 * (total / subtotal), so product revenue adds up to the revenue KPI.
 * The share column uses a window function over all products before the
 * search filter, so "share of revenue" stays true while searching.
 */
export async function products(
  pool: Pool,
  q: Omit<ProductsQuery, 'limit'> & { limit?: number },
): Promise<ProductRow[]> {
  const sortCol = PRODUCT_SORT_SQL[q.sort];
  const dir = q.dir === 'asc' ? 'ASC' : 'DESC';
  const params: unknown[] = [...rangeParams(q.from, q.to)];
  let search = '';
  if (q.q) {
    search = 'WHERE title LIKE ?';
    params.push(likeContains(q.q));
  }
  let limit = '';
  if (q.limit !== undefined) {
    limit = 'LIMIT ?';
    params.push(q.limit);
  }
  const [rows] = await pool.query<Rows>(
    `WITH per_product AS (
       SELECT p.id AS product_id, p.title, p.category,
              SUM(oi.quantity) AS units,
              SUM(CASE WHEN o.status = 'paid'
                       THEN oi.quantity * oi.unit_price * (o.total / o.subtotal)
                       ELSE 0 END) AS revenue,
              SUM(CASE WHEN o.status = 'refunded' THEN oi.quantity ELSE 0 END) AS refunds
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN product_variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
       WHERE o.status IN ${COUNTED} AND ${rangeWhere('o')}
       GROUP BY p.id, p.title, p.category
     ),
     ranked AS (
       SELECT per_product.*,
              revenue / NULLIF(SUM(revenue) OVER (), 0) * 100 AS share
       FROM per_product
     )
     SELECT * FROM ranked
     ${search}
     ORDER BY ${sortCol} ${dir}, product_id
     ${limit}`,
    params,
  );
  return rows.map((r) => ({
    productId: Number(r.product_id),
    title: String(r.title),
    category: String(r.category),
    units: Number(r.units),
    revenue: round2(Number(r.revenue)),
    refunds: Number(r.refunds),
    share: round2(Number(r.share ?? 0)),
  }));
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function customers(
  pool: Pool,
  from: string,
  to: string,
  interval: Interval = defaultInterval(from, to),
): Promise<CustomersResponse> {
  const bucket = bucketExpr('o.created_at', interval);
  const [[seriesRows], [totalRows]] = await Promise.all([
    // For each bucket, each customer who ordered in it counts once. They are
    // "new" in that bucket if they had no counted order before their first
    // order in the bucket.
    pool.query<Rows>(
      `WITH per_bucket AS (
         SELECT ${bucket} AS bucket, o.customer_id, MIN(o.created_at) AS first_in_bucket
         FROM orders o
         WHERE o.status IN ${COUNTED} AND ${rangeWhere('o')}
         GROUP BY bucket, o.customer_id
       )
       SELECT bucket,
              COUNT(*) AS customers,
              SUM(NOT EXISTS (
                SELECT 1 FROM orders p
                WHERE p.customer_id = per_bucket.customer_id
                  AND p.status IN ${COUNTED}
                  AND p.created_at < per_bucket.first_in_bucket
              )) AS new_customers
       FROM per_bucket
       GROUP BY bucket
       ORDER BY bucket`,
      [...bucketParams(interval), ...rangeParams(from, to)],
    ),
    pool.query<Rows>(
      `SELECT COUNT(*) AS customers,
              COALESCE(SUM(c.n >= 2), 0) AS repeaters,
              COALESCE(SUM(NOT EXISTS (
                SELECT 1 FROM orders p
                WHERE p.customer_id = c.customer_id
                  AND p.status IN ${COUNTED}
                  AND p.created_at < CONVERT_TZ(?, ?, 'UTC')
              )), 0) AS new_customers
       FROM (
         SELECT o.customer_id, COUNT(*) AS n FROM orders o
         WHERE o.status IN ${COUNTED} AND ${rangeWhere('o')}
         GROUP BY o.customer_id
       ) c`,
      [`${from} 00:00:00`, STORE_TZ, ...rangeParams(from, to)],
    ),
  ]);

  const byBucket = new Map(seriesRows.map((r) => [String(r.bucket), r]));
  const series = bucketList(from, to, interval).map((b) => {
    const r = byBucket.get(b);
    const total = Number(r?.customers ?? 0);
    const fresh = Number(r?.new_customers ?? 0);
    return { bucket: b, newCustomers: fresh, returningCustomers: total - fresh };
  });
  const t = totalRows[0];
  const total = Number(t?.customers ?? 0);
  const fresh = Number(t?.new_customers ?? 0);
  return {
    interval,
    series,
    totals: {
      customers: total,
      newCustomers: fresh,
      returningCustomers: total - fresh,
      repeatRate: total ? round2((Number(t?.repeaters ?? 0) / total) * 100) : 0,
    },
  };
}

export async function topCustomers(
  pool: Pool,
  from: string,
  to: string,
  limit?: number,
): Promise<TopCustomerRow[]> {
  const params: unknown[] = [...rangeParams(from, to)];
  if (limit !== undefined) params.push(limit);
  const [rows] = await pool.query<Rows>(
    `SELECT c.id, CONCAT(c.first_name, ' ', c.last_name) AS name, c.email,
            COUNT(*) AS orders,
            SUM(o.total - COALESCE(r.amount, 0)) AS revenue,
            MAX(o.created_at) AS last_order_at
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     LEFT JOIN ${REFUNDS_BY_ORDER} r ON r.order_id = o.id
     WHERE o.status IN ${COUNTED} AND ${rangeWhere('o')}
     GROUP BY c.id, c.first_name, c.last_name, c.email
     ORDER BY revenue DESC, c.id
     ${limit !== undefined ? 'LIMIT ?' : ''}`,
    params,
  );
  return rows.map((r) => ({
    customerId: Number(r.id),
    name: String(r.name),
    email: String(r.email),
    orders: Number(r.orders),
    revenue: round2(Number(r.revenue)),
    lastOrderAt: utcIso(String(r.last_order_at)),
  }));
}

// ---------------------------------------------------------------------------
// Orders list
// ---------------------------------------------------------------------------

export const orderNumber = (id: number) => `#${1000 + id}`;
const utcIso = (sqlDateTime: string) => `${sqlDateTime.replace(' ', 'T')}Z`;

function orderFilters(q: Pick<OrdersQuery, 'from' | 'to' | 'status' | 'channel'>) {
  const where = [rangeWhere('o')];
  const params: unknown[] = [...rangeParams(q.from, q.to)];
  if (q.status) {
    where.push('o.status = ?');
    params.push(q.status);
  }
  if (q.channel) {
    where.push('o.channel = ?');
    params.push(q.channel);
  }
  return { where: where.join(' AND '), params };
}

export async function orders(pool: Pool, q: OrdersQuery): Promise<OrdersResponse> {
  const { where, params } = orderFilters(q);
  const offset = (q.page - 1) * q.pageSize;
  const [[rows], [count]] = await Promise.all([
    // Page of orders first (cheap, uses the date index), then the joins only
    // for those 25 rows.
    pool.query<Rows>(
      `SELECT o.id, o.created_at, o.channel, o.status, o.total,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
              (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM (
         SELECT o.id FROM orders o
         WHERE ${where}
         ORDER BY o.created_at DESC, o.id DESC
         LIMIT ? OFFSET ?
       ) page
       JOIN orders o ON o.id = page.id
       JOIN customers c ON c.id = o.customer_id
       ORDER BY o.created_at DESC, o.id DESC`,
      [...params, q.pageSize, offset],
    ),
    pool.query<Rows>(`SELECT COUNT(*) AS n FROM orders o WHERE ${where}`, params),
  ]);
  return {
    rows: rows.map((r): OrderRow => ({
      id: Number(r.id),
      number: orderNumber(Number(r.id)),
      createdAt: utcIso(String(r.created_at)),
      customerName: String(r.customer_name),
      channel: String(r.channel),
      status: String(r.status),
      items: Number(r.items ?? 0),
      total: Number(r.total),
    })),
    page: q.page,
    pageSize: q.pageSize,
    total: Number(count[0]?.n ?? 0),
  };
}

/** SQL and params for the full filtered orders list, used by the CSV export stream. */
export function ordersExportSql(q: Pick<OrdersQuery, 'from' | 'to' | 'status' | 'channel'>) {
  const { where, params } = orderFilters(q);
  return {
    sql: `SELECT CONCAT('#', 1000 + o.id) AS order_number,
                 DATE_FORMAT(CONVERT_TZ(o.created_at, 'UTC', ?), '%Y-%m-%d %H:%i:%s') AS created_at_et,
                 CONCAT(c.first_name, ' ', c.last_name) AS customer,
                 c.email,
                 o.channel, o.status,
                 (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) AS items,
                 -- As text so the file always shows two decimals (46.00, not 46).
                 CAST(o.subtotal AS CHAR) AS subtotal,
                 CAST(o.discount AS CHAR) AS discount,
                 CAST(o.total AS CHAR) AS total
          FROM orders o
          JOIN customers c ON c.id = o.customer_id
          WHERE ${where}
          ORDER BY o.created_at DESC, o.id DESC`,
    params: [STORE_TZ, ...params],
  };
}
