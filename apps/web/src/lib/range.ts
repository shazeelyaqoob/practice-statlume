import { dateRangeSchema, presetRange, storeToday } from '@statlume/shared';

export type SearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_PRESET = '30d' as const;

export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Reads ?from=&to= from the URL. A missing or invalid range falls back to the
 * last 30 days, so a bad link still shows a sensible page.
 */
export function readRange(params: SearchParams): { from: string; to: string } {
  const parsed = dateRangeSchema.safeParse({ from: first(params.from), to: first(params.to) });
  if (parsed.success) return parsed.data;
  return presetRange(DEFAULT_PRESET, storeToday());
}

/** Builds a query string from params, dropping empty values. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}
