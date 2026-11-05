import { MAX_RANGE_DAYS } from './constants.ts';

/** Store time zone. Every report groups by the store's local date. */
export const STORE_TZ = 'America/New_York';
export const STORE_TZ_LABEL = 'New York time (ET)';

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toUtcMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return fromUtcMs(target.getTime());
}

/** Number of calendar days in an inclusive range. */
export function daysInRange(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS) + 1;
}

/** The range of the same length that ends the day before `from`. */
export function previousPeriod(from: string, to: string): { from: string; to: string } {
  const length = daysInRange(from, to);
  const prevTo = addDays(from, -1);
  return { from: addDays(prevTo, -(length - 1)), to: prevTo };
}

/** Today's date in the store time zone. */
export function storeToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STORE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export type Interval = 'day' | 'week' | 'month';

/** A chart bucket size that keeps a chart between about 7 and 62 points. */
export function defaultInterval(from: string, to: string): Interval {
  const days = daysInRange(from, to);
  if (days <= 62) return 'day';
  if (days <= 190) return 'week';
  return 'month';
}

export const PRESETS = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'ytd', label: 'This year' },
  { id: '12m', label: 'Last 12 months' },
] as const;

export type PresetId = (typeof PRESETS)[number]['id'];

export function presetRange(id: PresetId, today: string): { from: string; to: string } {
  switch (id) {
    case '7d':
      return { from: addDays(today, -6), to: today };
    case '30d':
      return { from: addDays(today, -29), to: today };
    case '90d':
      return { from: addDays(today, -89), to: today };
    case 'ytd':
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    case '12m':
      return { from: addDays(addMonths(today, -12), 1), to: today };
  }
}

/** Which preset (if any) a range matches, so the picker can show its label. */
export function matchPreset(from: string, to: string, today: string): PresetId | null {
  for (const p of PRESETS) {
    const r = presetRange(p.id, today);
    if (r.from === from && r.to === to) return p.id;
  }
  return null;
}

/** Percent change, or null when the previous value is zero. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Checks a from/to pair without zod (used in the browser). Returns an error
 * message, or null when the range is fine. The API runs the same rules
 * through its zod schemas.
 */
export function checkRange(
  from: string | null | undefined,
  to: string | null | undefined,
): string | null {
  if (!from || !to || !isIsoDate(from) || !isIsoDate(to)) return 'Use the format YYYY-MM-DD';
  if (from > to) return 'The start date must be on or before the end date';
  if (daysInRange(from, to) > MAX_RANGE_DAYS) return `Range can be at most ${MAX_RANGE_DAYS} days`;
  return null;
}
