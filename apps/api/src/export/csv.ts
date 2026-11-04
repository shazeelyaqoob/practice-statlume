/**
 * CSV helpers.
 *
 * CSV injection: spreadsheet apps run a cell that starts with = + - @ (or a tab
 * or carriage return) as a formula, so a customer named "=HYPERLINK(...)" could
 * run code on whoever opens the export. Text cells that start with one of these
 * get a leading apostrophe, which spreadsheets show as plain text.
 * Numbers are left alone so negative values stay numbers.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  let text = String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function csvLine(values: readonly unknown[]): string {
  return `${values.map(escapeCsvCell).join(',')}\r\n`;
}

/** File name like halden-orders-2026-08-01_2026-10-31.csv */
export function exportFileName(report: string, from: string, to: string): string {
  return `halden-${report}-${from}_${to}.csv`;
}
