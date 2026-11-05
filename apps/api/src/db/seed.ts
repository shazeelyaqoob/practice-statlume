import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import argon2 from 'argon2';
import { STORE_TZ, addDays, storeToday } from '@statlume/shared';
import { CATALOG, CITIES, FIRST_NAMES, LAST_NAMES } from './catalog.ts';
import { createPool, type Pool } from './pool.ts';

/** Fixed seed: every machine gets exactly the same store history. */
const RANDOM_SEED = 20_261_104;
const DAYS = 365;

/** Small, fast, seeded PRNG (mulberry32). Math.random cannot be seeded. */
function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T;
  const weighted = <T>(items: readonly T[], weights: readonly number[]): T => {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i] as number;
      if (r <= 0) return items[i] as T;
    }
    return items[items.length - 1] as T;
  };
  return { next, int, pick, weighted };
}

type Rng = ReturnType<typeof createRng>;

// ---------- time helpers (store local time to UTC) ----------

const offsetCache = new Map<string, number>();
const tzFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STORE_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Minutes the store time zone is ahead of UTC at a given instant (negative for New York). */
function tzOffsetMinutes(utcMs: number): number {
  const parts = Object.fromEntries(
    tzFormatter.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - utcMs) / 60_000);
}

/** UTC epoch ms for a wall-clock time in the store time zone. */
function storeLocalToUtcMs(date: string, hour: number, minute: number, second: number): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const naive = Date.UTC(y, m - 1, d, hour, minute, second);
  const key = `${date}T${hour}`;
  let offset = offsetCache.get(key);
  if (offset === undefined) {
    offset = tzOffsetMinutes(naive - tzOffsetMinutes(naive) * 60_000);
    offsetCache.set(key, offset);
  }
  return naive - offset * 60_000;
}

function toSqlDateTime(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

const money = (cents: number) => (cents / 100).toFixed(2);

// ---------- demand model ----------

/** Relative order volume for a store-local date. */
function dayWeight(date: string, index: number, rng: Rng): number {
  const d = new Date(`${date}T00:00:00Z`);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const weekday = d.getUTCDay();

  let w = 1 + 0.35 * (index / DAYS); // the store grows across the year
  if (weekday === 0 || weekday === 6) w *= 1.22;
  if (weekday === 1) w *= 0.92;
  if (month === 11 && day >= 20) w *= 1.7;
  if (month === 12 && day <= 22) w *= 1.9;
  if (month === 12 && day >= 26) w *= 1.25; // gift card and sale week
  if (month === 1 && day <= 20) w *= 0.8; // January lull
  if (month === 2 && day >= 7 && day <= 13) w *= 1.25;
  if (month === 5 && day >= 4 && day <= 10) w *= 1.3;
  if (month === 7 || month === 8) w *= 0.9;
  // Black Friday and Cyber Monday: 4th Friday of November and the Monday after.
  if (month === 11 && weekday === 5 && day >= 22 && day <= 28) w *= 2.6;
  if ((month === 11 && weekday === 1 && day >= 25) || (month === 12 && weekday === 1 && day <= 1))
    w *= 2.1;
  return w * (0.85 + rng.next() * 0.3);
}

const HOUR_WEIGHTS = [
  1, 0.6, 0.4, 0.3, 0.3, 0.5, 1, 2, 3, 3.6, 4, 4.2, 4.6, 4.4, 4, 4, 4.2, 4.6, 5.2, 6, 6.4, 5.6, 4,
  2.2,
];
const HOURS = HOUR_WEIGHTS.map((_, i) => i);

const CHANNELS = ['online', 'mobile', 'social'] as const;

export interface SeedOptions {
  orders?: number;
  endDate?: string;
  /** Cap generated timestamps at this instant (defaults to now when endDate is today). */
  now?: Date;
  log?: boolean;
  /** Rewrite only the store data and keep users and their sessions. */
  keepUsers?: boolean;
}

export interface SeedResult {
  orders: number;
  customers: number;
  items: number;
  refunds: number;
  from: string;
  to: string;
  passwords: { admin: string; viewer: string };
}

/** Wipes all store data and users, then writes a full year of store history. */
export async function seed(pool: Pool, opts: SeedOptions = {}): Promise<SeedResult> {
  const totalOrders = opts.orders ?? 10_000;
  const endDate = opts.endDate ?? storeToday();
  const startDate = addDays(endDate, -(DAYS - 1));
  const now = opts.now ?? new Date();
  const nowMs = Math.min(now.getTime(), storeLocalToUtcMs(addDays(endDate, 1), 0, 0, 0) - 1000);
  const log = opts.log !== false ? console.log : () => {};
  const rng = createRng(RANDOM_SEED);
  const started = Date.now();

  // ---------- catalog ----------
  const catalogCreated = toSqlDateTime(storeLocalToUtcMs(addDays(startDate, -30), 9, 0, 0));
  const products: (string | number)[][] = [];
  const variants: (string | number)[][] = [];
  const variantPool: { id: number; cents: number }[][] = [];
  let variantId = 0;
  CATALOG.forEach((p, i) => {
    const productId = i + 1;
    products.push([productId, p.title, p.category, catalogCreated]);
    const list: { id: number; cents: number }[] = [];
    p.variants.forEach((v, j) => {
      variantId++;
      const cents = Math.round(v.price * 100);
      variants.push([
        variantId,
        productId,
        v.title,
        `HG-${String(productId).padStart(3, '0')}-${j + 1}`,
        money(cents),
      ]);
      list.push({ id: variantId, cents });
    });
    variantPool.push(list);
  });
  const productIndexes = CATALOG.map((_, i) => i);
  const productWeights = CATALOG.map((p) => p.weight);

  // ---------- order timestamps ----------
  const dates = Array.from({ length: DAYS }, (_, i) => addDays(startDate, i));
  const weights = dates.map((d, i) => dayWeight(d, i, rng));
  const weightSum = weights.reduce((s, w) => s + w, 0);
  const times: number[] = [];
  let carry = 0;
  dates.forEach((date, i) => {
    const exact = (totalOrders * (weights[i] as number)) / weightSum + carry;
    const count = i === DAYS - 1 ? totalOrders - times.length : Math.round(exact);
    carry = exact - count;
    for (let k = 0; k < count; k++) {
      const hour = rng.weighted(HOURS, HOUR_WEIGHTS);
      let ms = storeLocalToUtcMs(date, hour, rng.int(0, 59), rng.int(0, 59));
      if (ms > nowMs) ms = nowMs - rng.int(60, 6 * 3600) * 1000;
      times.push(ms);
    }
  });
  times.sort((a, b) => a - b);

  // ---------- customers and who placed which order ----------
  const customerCount = Math.max(1, Math.round(totalOrders * 0.4));
  const singleBuyers = Math.round(customerCount * 0.66);
  const repeaters = customerCount - singleBuyers;
  const ordersPerCustomer = new Array<number>(customerCount).fill(1);
  for (let c = singleBuyers; c < customerCount; c++) ordersPerCustomer[c] = 2;
  let leftover = totalOrders - singleBuyers - repeaters * 2;
  const loyalty = Array.from({ length: repeaters }, () => rng.next() ** 3);
  const repeaterIds = loyalty.map((_, i) => singleBuyers + i);
  while (leftover > 0) {
    const c = rng.weighted(repeaterIds, loyalty);
    ordersPerCustomer[c] = (ordersPerCustomer[c] as number) + 1;
    leftover--;
  }
  // One slot per order, shuffled, then matched to the sorted timestamps.
  const slots: number[] = [];
  ordersPerCustomer.forEach((n, c) => {
    for (let k = 0; k < n; k++) slots.push(c);
  });
  slots.length = totalOrders;
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [slots[i], slots[j]] = [slots[j] as number, slots[i] as number];
  }
  const firstSeen = new Array<number>(customerCount).fill(0);
  slots.forEach((c, i) => {
    if (!firstSeen[c]) firstSeen[c] = times[i] as number;
  });

  const customers: (string | number)[][] = [];
  for (let c = 0; c < customerCount; c++) {
    const first = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const joined = (firstSeen[c] || nowMs) - rng.int(0, 3 * 86_400) * 1000;
    customers.push([
      c + 1,
      `${first}.${last}.${c + 1}@example.com`.toLowerCase(),
      first,
      last,
      rng.pick(CITIES),
      toSqlDateTime(joined),
    ]);
  }

  // ---------- orders, items, refunds ----------
  const orders: (string | number)[][] = [];
  const items: (string | number)[][] = [];
  const refunds: (string | number)[][] = [];
  let itemId = 0;
  const firstTime = times[0] ?? 0;
  const span = Math.max(1, (times[times.length - 1] ?? 0) - firstTime);
  times.forEach((ms, i) => {
    const orderId = i + 1;
    const progress = (ms - firstTime) / span;
    const channel = rng.weighted(CHANNELS, [0.6 - 0.1 * progress, 0.28 + 0.1 * progress, 0.12]);
    const lineCount = rng.weighted([1, 2, 3, 4], [55, 28, 12, 5]);
    const chosen = new Set<number>();
    let subtotal = 0;
    while (chosen.size < lineCount) chosen.add(rng.weighted(productIndexes, productWeights));
    for (const p of chosen) {
      const v = rng.pick(variantPool[p] as { id: number; cents: number }[]);
      const qty = rng.weighted([1, 2, 3], [80, 15, 5]);
      subtotal += v.cents * qty;
      items.push([++itemId, orderId, v.id, qty, money(v.cents)]);
    }
    const discount = rng.next() < 0.12 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount;
    const r = rng.next();
    const status = r < 0.01 ? 'cancelled' : r < 0.04 ? 'refunded' : 'paid';
    if (status === 'refunded') {
      const refundedAt = Math.min(
        nowMs,
        ms + rng.int(1, 14) * 86_400_000 + rng.int(0, 36_000) * 1000,
      );
      refunds.push([refunds.length + 1, orderId, money(total), toSqlDateTime(refundedAt)]);
    }
    orders.push([
      orderId,
      (slots[i] as number) + 1,
      channel,
      status,
      money(subtotal),
      money(discount),
      money(total),
      toSqlDateTime(ms),
    ]);
  });

  // ---------- users ----------
  const passwords = {
    admin: process.env.SEED_ADMIN_PASSWORD || randomBytes(9).toString('base64url'),
    viewer: process.env.SEED_VIEWER_PASSWORD || randomBytes(9).toString('base64url'),
  };
  const users = [
    ['admin@statlume.test', 'Demo Admin', await argon2.hash(passwords.admin), 'admin', 1],
    ['viewer@statlume.test', 'Demo Viewer', await argon2.hash(passwords.viewer), 'viewer', 1],
  ];

  // ---------- write ----------
  const conn = await pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of [
      'refunds',
      'order_items',
      'orders',
      'customers',
      'product_variants',
      'products',
      ...(opts.keepUsers ? [] : ['refresh_tokens', 'users']),
    ]) {
      await conn.query(`TRUNCATE TABLE ${t}`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const insert = async (sql: string, rows: unknown[][], batch = 2000) => {
      for (let i = 0; i < rows.length; i += batch) {
        await conn.query(sql, [rows.slice(i, i + batch)]);
      }
    };
    if (!opts.keepUsers) {
      await insert('INSERT INTO users (email, name, password_hash, role, is_demo) VALUES ?', users);
    }
    await insert('INSERT INTO products (id, title, category, created_at) VALUES ?', products);
    await insert(
      'INSERT INTO product_variants (id, product_id, title, sku, price) VALUES ?',
      variants,
    );
    await insert(
      'INSERT INTO customers (id, email, first_name, last_name, city, created_at) VALUES ?',
      customers,
    );
    await insert(
      'INSERT INTO orders (id, customer_id, channel, status, subtotal, discount, total, created_at) VALUES ?',
      orders,
    );
    await insert(
      'INSERT INTO order_items (id, order_id, variant_id, quantity, unit_price) VALUES ?',
      items,
      5000,
    );
    await insert('INSERT INTO refunds (id, order_id, amount, created_at) VALUES ?', refunds);
    await conn.query('ANALYZE TABLE orders, order_items, refunds, customers');
  } finally {
    conn.release();
  }

  log(
    `seeded ${orders.length.toLocaleString('en-US')} orders, ${customers.length.toLocaleString('en-US')} customers, ` +
      `${items.length.toLocaleString('en-US')} items, ${refunds.length} refunds ` +
      `(${startDate} to ${endDate}) in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
  return {
    orders: orders.length,
    customers: customers.length,
    items: items.length,
    refunds: refunds.length,
    from: startDate,
    to: endDate,
    passwords,
  };
}

export function printPasswords(passwords: SeedResult['passwords']) {
  console.log('\nDemo accounts (the login page also has one-click demo buttons):');
  console.log(
    `  admin@statlume.test   ${process.env.SEED_ADMIN_PASSWORD ? '(SEED_ADMIN_PASSWORD)' : passwords.admin}`,
  );
  console.log(
    `  viewer@statlume.test  ${process.env.SEED_VIEWER_PASSWORD ? '(SEED_VIEWER_PASSWORD)' : passwords.viewer}\n`,
  );
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: { orders: { type: 'string' }, 'end-date': { type: 'string' } },
  });
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const orders = values.orders ? Number(values.orders) : undefined;
  if (orders !== undefined && (!Number.isInteger(orders) || orders < 100 || orders > 2_000_000)) {
    throw new Error('--orders must be a whole number between 100 and 2000000');
  }
  const pool = createPool(url);
  const result = await seed(pool, {
    orders,
    endDate: values['end-date'] || process.env.SEED_END_DATE || undefined,
  });
  printPasswords(result.passwords);
  await pool.end();
}
