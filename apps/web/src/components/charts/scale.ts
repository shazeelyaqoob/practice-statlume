/**
 * Small drawing helpers for the server-drawn charts. Everything is drawn in a
 * fixed viewBox and stretched to the box, so no measuring is needed.
 */
export const VB_W = 1000;
export const VB_H = 220;

/** About `count` evenly spaced round numbers from 0 up past `maxValue`. */
export function niceTicks(maxValue: number, { count = 4, integer = false } = {}): number[] {
  const max = maxValue > 0 ? maxValue : 1;
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  let step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s * count >= max) ?? 10 * mag;
  if (integer) step = Math.max(1, Math.ceil(step));
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6);
}

/** Horizontal centre of bucket `i` out of `n`. */
export const bandCenter = (i: number, n: number) => ((i + 0.5) * VB_W) / n;

/** Vertical position of a value, with 0 at the bottom. */
export const yFor = (value: number, max: number) => VB_H * (1 - value / max);

const r = (v: number) => Math.round(v * 10) / 10;

/**
 * A smooth line through evenly spaced points that never overshoots
 * (monotone cubic, the same idea as d3's curveMonotoneX).
 */
export function monotonePath(points: Array<[number, number]>): string {
  const n = points.length;
  const first = points[0];
  if (!first) return '';
  if (n === 1) return `M0 ${r(first[1])}L${VB_W} ${r(first[1])}`;
  const h = points[1]![0] - first[0];
  const slopes = points.slice(1).map((p, i) => (p[1] - points[i]![1]) / h);
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0]!;
    if (i === n - 1) return slopes[n - 2]!;
    const a = slopes[i - 1]!;
    const b = slopes[i]!;
    if (a * b <= 0) return 0;
    return Math.sign(a) * Math.min(2 * Math.abs(a), 2 * Math.abs(b), Math.abs(a + b) / 2);
  });
  let d = `M${r(first[0])} ${r(first[1])}`;
  for (let i = 1; i < n; i++) {
    const [x0, y0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    const m0 = tangents[i - 1]!;
    const m1 = tangents[i]!;
    d += `C${r(x0 + h / 3)} ${r(y0 + (m0 * h) / 3)} ${r(x1 - h / 3)} ${r(y1 - (m1 * h) / 3)} ${r(x1)} ${r(y1)}`;
  }
  return d;
}

/** The same line closed down to the baseline, for a filled area. */
export function monotoneArea(points: Array<[number, number]>): string {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return '';
  const x0 = points.length === 1 ? 0 : first[0];
  const x1 = points.length === 1 ? VB_W : last[0];
  return `${monotonePath(points)}L${r(x1)} ${VB_H}L${r(x0)} ${VB_H}Z`;
}
