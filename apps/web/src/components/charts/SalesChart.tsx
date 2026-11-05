import type { Interval, SalesPoint } from '@statlume/shared/client';
import {
  formatDayMonth,
  formatInt,
  formatMoney,
  formatMoneyCompact,
  formatMonthYear,
} from '@/lib/format';
import { ChartFrame } from './ChartFrame';
import type { HoverRow } from './ChartHover';
import { VB_H, VB_W, bandCenter, monotoneArea, monotonePath, niceTicks, yFor } from './scale';

type Metric = 'revenue' | 'orders';

function bucketLabel(bucket: string, interval: Interval) {
  return interval === 'month' ? formatMonthYear(bucket) : formatDayMonth(bucket);
}

/**
 * Current period against the previous one, lined up bucket by bucket
 * (day 1 with day 1, and so on). Drawn on the server as plain SVG.
 */
export function SalesChart({
  current,
  previous,
  interval,
  metric,
  title,
}: {
  current: SalesPoint[];
  previous: SalesPoint[];
  interval: Interval;
  metric: Metric;
  title: string;
}) {
  const n = current.length;
  const cur = current.map((p) => p[metric]);
  const prev = previous.slice(0, n).map((p) => p[metric]);
  const labels = current.map((p) => bucketLabel(p.bucket, interval));
  const fmt = metric === 'revenue' ? formatMoney : formatInt;
  const ticks = niceTicks(Math.max(0, ...cur, ...prev), { integer: metric === 'orders' });
  const max = ticks.at(-1) ?? 1;

  const total = cur.reduce((s, v) => s + v, 0);
  const prevTotal = previous.reduce((s, p) => s + p[metric], 0);
  const summary = `${title}: ${fmt(total)} this period, ${fmt(prevTotal)} the period before.`;

  const hoverRows: HoverRow[] = current.map((p, i) => {
    const before = previous[i];
    return {
      items: [
        { name: labels[i]!, value: fmt(p[metric]), color: 'tide' },
        ...(before
          ? [
              {
                name: bucketLabel(before.bucket, interval),
                value: fmt(before[metric]),
                color: 'pollen' as const,
                muted: true,
              },
            ]
          : []),
      ],
    };
  });

  let drawing;
  if (metric === 'revenue') {
    const curPts = cur.map((v, i): [number, number] => [bandCenter(i, n), yFor(v, max)]);
    const prevPts = prev.map((v, i): [number, number] => [bandCenter(i, n), yFor(v, max)]);
    drawing = (
      <>
        <path d={monotoneArea(curPts)} fill="var(--color-tide-soft)" />
        <path
          d={monotonePath(curPts)}
          fill="none"
          stroke="var(--color-tide)"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={monotonePath(prevPts)}
          fill="none"
          stroke="var(--color-pollen)"
          strokeWidth={2}
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
      </>
    );
  } else {
    const band = VB_W / n;
    const gap = band * 0.04;
    const barW = (band * 0.8 - gap) / 2;
    const bar = (v: number, x: number, fill: string, key: string) => (
      <rect
        key={key}
        x={x}
        y={yFor(v, max)}
        width={barW}
        height={VB_H - yFor(v, max)}
        fill={fill}
      />
    );
    drawing = (
      <g shapeRendering="crispEdges">
        {cur.map((v, i) => bar(v, i * band + band * 0.1, 'var(--color-tide)', `c${i}`))}
        {prev.map((v, i) =>
          bar(v, i * band + band * 0.1 + barW + gap, 'var(--color-pollen)', `p${i}`),
        )}
      </g>
    );
  }

  return (
    <figure className="panel p-4">
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <span className="num text-xl font-medium">{fmt(total)}</span>
        <span className="text-muted flex items-center gap-1.5">
          <span className="bg-tide inline-block h-0.75 w-3 rounded" aria-hidden="true" />
          This period
        </span>
        <span className="text-muted flex items-center gap-1.5">
          <span className="bg-pollen inline-block h-0.75 w-3 rounded" aria-hidden="true" />
          Period before ({fmt(prevTotal)})
        </span>
        <span className="sr-only">{summary}</span>
      </figcaption>
      <ChartFrame
        ticks={ticks}
        tickLabel={metric === 'revenue' ? formatMoneyCompact : formatInt}
        labels={labels}
        axisWidth={64}
        hoverRows={hoverRows}
        swatch="line"
      >
        {drawing}
      </ChartFrame>
      {/* The same numbers for screen readers, which skip the drawing. */}
      <table className="sr-only">
        <caption>
          {title} by {interval}
        </caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">This period</th>
            <th scope="col">Period before</th>
          </tr>
        </thead>
        <tbody>
          {current.map((p, i) => (
            <tr key={p.bucket}>
              <th scope="row">{labels[i]}</th>
              <td>{fmt(p[metric])}</td>
              <td>{prev[i] === undefined ? 'none' : fmt(prev[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
