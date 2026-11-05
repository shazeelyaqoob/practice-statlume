import { areaPath, linePath } from './chartPath';

/* Small drawings of each report for the landing page. Decorative only. */

const box = 'block h-auto w-full';

export function OverviewPreview() {
  const scale = { width: 200, height: 80, min: 0, max: 10 };
  const now = [3, 4, 3.6, 5, 4.6, 6, 5.6, 7, 6.8, 8.2];
  const before = [2.6, 3, 3, 3.6, 3.4, 4, 4, 4.6, 4.4, 5];
  return (
    <svg viewBox="0 0 200 96" className={box} aria-hidden="true">
      <path d={areaPath(now, scale)} fill="#127C7A1F" />
      <path
        d={linePath(before, scale)}
        fill="none"
        stroke="#E5B92B"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <path d={linePath(now, scale)} fill="none" stroke="#127C7A" strokeWidth="2.5" />
      <line x1="0" y1="88" x2="200" y2="88" stroke="#15191C33" />
    </svg>
  );
}

export function ProductsPreview() {
  const widths = [168, 132, 104, 84, 60];
  return (
    <svg viewBox="0 0 200 96" className={box} aria-hidden="true">
      {widths.map((w, i) => (
        <g key={w} transform={`translate(0 ${4 + i * 18})`}>
          <rect width="200" height="10" rx="2" fill="#15191C0F" />
          <rect width={w} height="10" rx="2" fill="#127C7A" opacity={1 - i * 0.14} />
        </g>
      ))}
    </svg>
  );
}

export function CustomersPreview() {
  const bars: [number, number][] = [
    [22, 30],
    [26, 34],
    [20, 40],
    [28, 38],
    [24, 46],
    [30, 44],
    [26, 52],
  ];
  return (
    <svg viewBox="0 0 200 96" className={box} aria-hidden="true">
      {bars.map(([fresh, back], i) => {
        const x = 6 + i * 28;
        return (
          <g key={x}>
            <rect x={x} y={88 - fresh} width="18" height={fresh} fill="#127C7A" />
            <rect x={x} y={88 - fresh - back} width="18" height={back} rx="2" fill="#E5B92B" />
          </g>
        );
      })}
      <line x1="0" y1="88.5" x2="200" y2="88.5" stroke="#15191C33" />
    </svg>
  );
}

export function OrdersPreview() {
  const rows: { stroke: string; w: number }[] = [
    { stroke: '#127C7A', w: 34 },
    { stroke: '#127C7A', w: 34 },
    { stroke: '#C2410C', w: 46 },
    { stroke: '#127C7A', w: 34 },
    { stroke: '#5E686D', w: 48 },
  ];
  return (
    <svg viewBox="0 0 200 96" className={box} aria-hidden="true">
      {rows.map((r, i) => {
        const y = 4 + i * 18;
        return (
          <g key={y}>
            <rect x="0" y={y + 3} width="30" height="6" rx="1.5" fill="#15191C" opacity=".75" />
            <rect x="40" y={y + 3} width="62" height="6" rx="1.5" fill="#15191C1F" />
            <rect
              x={112}
              y={y}
              width={r.w}
              height="12"
              rx="3"
              fill="none"
              stroke={r.stroke}
              strokeWidth="1.4"
            />
            <rect x="170" y={y + 3} width="30" height="6" rx="1.5" fill="#15191C" opacity=".75" />
          </g>
        );
      })}
    </svg>
  );
}
