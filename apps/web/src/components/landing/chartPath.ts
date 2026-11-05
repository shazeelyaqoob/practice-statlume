/** Builds SVG path data for a simple line through evenly spaced values. */
export function linePath(
  values: number[],
  {
    width,
    height,
    top = 6,
    bottom = 6,
    min,
    max,
  }: {
    width: number;
    height: number;
    top?: number;
    bottom?: number;
    min: number;
    max: number;
  },
): string {
  const step = width / (values.length - 1);
  const y = (v: number) => top + (1 - (v - min) / (max - min)) * (height - top - bottom);
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(' ');
}

/** Same line, closed down to the baseline, for a filled area. */
export function areaPath(values: number[], opts: Parameters<typeof linePath>[1]): string {
  return `${linePath(values, opts)} L${opts.width} ${opts.height} L0 ${opts.height} Z`;
}
