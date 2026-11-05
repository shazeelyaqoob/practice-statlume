import type { CustomersPoint, Interval } from '@statlume/shared/client';
import { formatDayMonth, formatInt, formatMonthYear } from '@/lib/format';
import { ChartFrame } from './ChartFrame';
import type { HoverRow } from './ChartHover';
import { VB_H, VB_W, niceTicks, yFor } from './scale';

/** New and returning customers per bucket, stacked. Drawn on the server. */
export function CustomersChart({
  series,
  interval,
}: {
  series: CustomersPoint[];
  interval: Interval;
}) {
  const n = series.length;
  const labels = series.map((p) =>
    interval === 'month' ? formatMonthYear(p.bucket) : formatDayMonth(p.bucket),
  );
  const ticks = niceTicks(
    Math.max(0, ...series.map((p) => p.newCustomers + p.returningCustomers)),
    {
      integer: true,
    },
  );
  const max = ticks.at(-1) ?? 1;
  const newTotal = series.reduce((s, p) => s + p.newCustomers, 0);
  const retTotal = series.reduce((s, p) => s + p.returningCustomers, 0);

  const hoverRows: HoverRow[] = series.map((p, i) => ({
    title: labels[i],
    items: [
      { name: 'New', value: formatInt(p.newCustomers), color: 'tide' },
      { name: 'Returning', value: formatInt(p.returningCustomers), color: 'pollen' },
    ],
  }));

  const band = VB_W / n;
  const barW = band * 0.7;

  return (
    <figure className="panel p-4">
      <figcaption className="text-muted mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="bg-tide inline-block size-2.5 rounded-sm" aria-hidden="true" />
          New customers
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-pollen inline-block size-2.5 rounded-sm" aria-hidden="true" />
          Returning customers
        </span>
        <span className="sr-only">
          Customers per {interval}: {formatInt(newTotal)} new and {formatInt(retTotal)} returning
          across the buckets.
        </span>
      </figcaption>
      <ChartFrame
        ticks={ticks}
        tickLabel={formatInt}
        labels={labels}
        axisWidth={48}
        hoverRows={hoverRows}
        swatch="box"
      >
        <g shapeRendering="crispEdges">
          {series.map((p, i) => {
            const x = i * band + (band - barW) / 2;
            const yNew = yFor(p.newCustomers, max);
            const yTop = yFor(p.newCustomers + p.returningCustomers, max);
            return (
              <g key={p.bucket}>
                <rect x={x} y={yNew} width={barW} height={VB_H - yNew} fill="var(--color-tide)" />
                <rect x={x} y={yTop} width={barW} height={yNew - yTop} fill="var(--color-pollen)" />
              </g>
            );
          })}
        </g>
      </ChartFrame>
      <table className="sr-only">
        <caption>New and returning customers by {interval}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">New</th>
            <th scope="col">Returning</th>
          </tr>
        </thead>
        <tbody>
          {series.map((p, i) => (
            <tr key={p.bucket}>
              <th scope="row">{labels[i]}</th>
              <td>{formatInt(p.newCustomers)}</td>
              <td>{formatInt(p.returningCustomers)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
