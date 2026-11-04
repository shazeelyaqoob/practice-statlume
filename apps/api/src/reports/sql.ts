import { STORE_TZ, addDays, addMonths, type Interval } from '@statlume/shared';

/**
 * Orders that count as sales. Cancelled orders never count. Written as IN (...)
 * rather than <> 'cancelled' so MySQL can use an index range on `status`.
 */
export const COUNTED = `('paid', 'refunded')`;

/**
 * Date range filter on `alias.created_at`, in store time.
 *
 * The column is compared against two constants (store midnight converted to
 * UTC), never wrapped in a function, so an index on created_at can be used.
 * Wrapping the column, as in DATE(CONVERT_TZ(created_at, ...)) BETWEEN ...,
 * would force a full scan.
 */
export function rangeWhere(alias: string): string {
  return `${alias}.created_at >= CONVERT_TZ(?, ?, 'UTC') AND ${alias}.created_at < CONVERT_TZ(?, ?, 'UTC')`;
}

export function rangeParams(from: string, to: string): string[] {
  return [`${from} 00:00:00`, STORE_TZ, `${addDays(to, 1)} 00:00:00`, STORE_TZ];
}

/** Store-local DATETIME for a UTC column. Needs one `?` bound to STORE_TZ. */
export function localTime(column: string): string {
  return `CONVERT_TZ(${column}, 'UTC', ?)`;
}

/**
 * Bucket start date (YYYY-MM-DD, store time) for a UTC column.
 * Needs one `?` bound to STORE_TZ. Weeks start on Monday.
 */
export function bucketExpr(column: string, interval: Interval): string {
  const local = `DATE(${localTime(column)})`;
  switch (interval) {
    case 'day':
      return local;
    case 'week':
      return `${local} - INTERVAL WEEKDAY(${local}) DAY`;
    case 'month':
      return `DATE_FORMAT(${local}, '%Y-%m-01')`;
  }
}

/** Number of `?` placeholders in bucketExpr for an interval. */
export function bucketParamCount(interval: Interval): number {
  return interval === 'week' ? 2 : 1;
}

export function bucketParams(interval: Interval): string[] {
  return Array.from({ length: bucketParamCount(interval) }, () => STORE_TZ);
}

/** Every bucket start between from and to, so days with no orders still show as zero. */
export function bucketList(from: string, to: string, interval: Interval): string[] {
  const out: string[] = [];
  if (interval === 'day') {
    for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  } else if (interval === 'week') {
    const weekday = (new Date(`${from}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
    for (let d = addDays(from, -weekday); d <= to; d = addDays(d, 7)) out.push(d);
  } else {
    for (let d = `${from.slice(0, 7)}-01`; d <= to; d = addMonths(d, 1)) out.push(d);
  }
  return out;
}

/** Refunds per order. Aggregated first so an order with two refunds is not counted twice. */
export const REFUNDS_BY_ORDER = `(SELECT order_id, SUM(amount) AS amount FROM refunds GROUP BY order_id)`;

/** Escapes LIKE wildcards in user input. */
export function likeContains(input: string): string {
  return `%${input.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
