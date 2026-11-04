'use client';

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Interval, SalesPoint } from '@statlume/shared';
import {
  formatDayMonth,
  formatInt,
  formatMoney,
  formatMoneyCompact,
  formatMonthYear,
} from '@/lib/format';

const TIDE = '#127C7A';
const POLLEN = '#E5B92B';
const MUTED = '#5E686D';
const RULE = '#15191C14';

type Metric = 'revenue' | 'orders';

interface Row {
  label: string;
  bucket: string;
  previousBucket?: string;
  current: number;
  previous?: number;
}

function bucketLabel(bucket: string, interval: Interval) {
  return interval === 'month' ? formatMonthYear(bucket) : formatDayMonth(bucket);
}

function TooltipBox({
  active,
  payload,
  metric,
  interval,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  metric: Metric;
  interval: Interval;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const fmt = metric === 'revenue' ? formatMoney : formatInt;
  return (
    <div className="panel border-rule-strong grid gap-1 border px-3 py-2 text-sm shadow-sm">
      <p className="flex items-center gap-2">
        <span className="bg-tide inline-block h-0.75 w-3 rounded" aria-hidden="true" />
        {bucketLabel(row.bucket, interval)}
        <span className="num ml-auto pl-4 font-medium">{fmt(row.current)}</span>
      </p>
      {row.previousBucket !== undefined && row.previous !== undefined ? (
        <p className="text-muted flex items-center gap-2">
          <span className="bg-pollen inline-block h-0.75 w-3 rounded" aria-hidden="true" />
          {bucketLabel(row.previousBucket, interval)}
          <span className="num ml-auto pl-4">{fmt(row.previous)}</span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Current period against the previous one, lined up bucket by bucket
 * (day 1 with day 1, and so on).
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
  const data: Row[] = current.map((p, i) => ({
    label: bucketLabel(p.bucket, interval),
    bucket: p.bucket,
    current: p[metric],
    previousBucket: previous[i]?.bucket,
    previous: previous[i]?.[metric],
  }));
  const total = current.reduce((s, p) => s + p[metric], 0);
  const prevTotal = previous.reduce((s, p) => s + p[metric], 0);
  const fmtTotal = metric === 'revenue' ? formatMoney : formatInt;
  const axisFmt = (v: number) => (metric === 'revenue' ? formatMoneyCompact(v) : formatInt(v));
  const summary = `${title}: ${fmtTotal(total)} this period, ${fmtTotal(prevTotal)} the period before.`;

  const common = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={RULE} />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={{ stroke: RULE }}
        tick={{ fill: MUTED, fontSize: 12, fontFamily: 'var(--font-mono)' }}
        minTickGap={24}
      />
      <YAxis
        tickFormatter={axisFmt}
        tickLine={false}
        axisLine={false}
        width={56}
        tick={{ fill: MUTED, fontSize: 12, fontFamily: 'var(--font-mono)' }}
      />
      <Tooltip
        cursor={{ stroke: '#15191C33', fill: '#15191C0A' }}
        content={<TooltipBox metric={metric} interval={interval} />}
      />
    </>
  );

  return (
    <figure className="panel p-4">
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <span className="num text-xl font-medium">{fmtTotal(total)}</span>
        <span className="text-muted flex items-center gap-1.5">
          <span className="bg-tide inline-block h-0.75 w-3 rounded" aria-hidden="true" />
          This period
        </span>
        <span className="text-muted flex items-center gap-1.5">
          <span className="bg-pollen inline-block h-0.75 w-3 rounded" aria-hidden="true" />
          Period before ({fmtTotal(prevTotal)})
        </span>
        <span className="sr-only">{summary}</span>
      </figcaption>
      <div className="h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          {metric === 'revenue' ? (
            <ComposedChart {...common}>
              {axes}
              <Area
                type="monotone"
                dataKey="current"
                stroke={TIDE}
                strokeWidth={2.5}
                fill="#127C7A1F"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="previous"
                stroke={POLLEN}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          ) : (
            <BarChart {...common} barGap={2}>
              {axes}
              <Bar dataKey="current" fill={TIDE} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar
                dataKey="previous"
                fill={POLLEN}
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
