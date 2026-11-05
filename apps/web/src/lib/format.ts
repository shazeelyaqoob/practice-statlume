import { STORE_TZ } from '@statlume/shared/client';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat('en-US');

export const formatMoney = (n: number) => usd.format(n);
export const formatMoneyWhole = (n: number) => usdWhole.format(n);
export const formatMoneyCompact = (n: number) => usdCompact.format(n);
export const formatInt = (n: number) => int.format(n);
export const formatPercent = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

/** "+12.4%" or "-2.3%", or "+4.0 pts" for rates. */
export function formatChange(change: number | null, unit: '%' | 'pts' = '%'): string {
  if (change === null) return 'No data before';
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  const abs = Math.abs(change).toFixed(1);
  return unit === 'pts' ? `${sign}${abs} pts` : `${sign}${abs}%`;
}

const dateOnly = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const dayMonth = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const monthYear = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** A YYYY-MM-DD store date, shown as "3 Oct 2026". */
export const formatDate = (iso: string) => dateOnly.format(new Date(`${iso}T00:00:00Z`));
export const formatDayMonth = (iso: string) => dayMonth.format(new Date(`${iso}T00:00:00Z`));
export const formatMonthYear = (iso: string) => monthYear.format(new Date(`${iso}T00:00:00Z`));

export function formatRange(from: string, to: string): string {
  if (from === to) return formatDate(from);
  if (from.slice(0, 4) === to.slice(0, 4)) return `${formatDayMonth(from)} to ${formatDate(to)}`;
  return `${formatDate(from)} to ${formatDate(to)}`;
}

const storeDateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: STORE_TZ,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** A UTC ISO timestamp, shown in store time: "31 Oct, 16:09". */
export const formatStoreDateTime = (isoUtc: string) => storeDateTime.format(new Date(isoUtc));

const storeDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: STORE_TZ,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
export const formatStoreDate = (isoUtc: string) => storeDate.format(new Date(isoUtc));
