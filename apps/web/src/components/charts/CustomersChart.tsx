'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CustomersPoint, Interval } from '@statlume/shared';
import { formatDayMonth, formatInt, formatMonthYear } from '@/lib/format';

const TIDE = '#127C7A';
const POLLEN = '#E5B92B';
const MUTED = '#5E686D';
const RULE = '#15191C14';

interface Row extends CustomersPoint {
  label: string;
}

function TooltipBox({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="panel border-rule-strong grid gap-1 border px-3 py-2 text-sm shadow-sm">
      <p className="font-semibold">{row.label}</p>
      <p className="flex items-center gap-2">
        <span className="bg-tide inline-block size-2.5 rounded-sm" aria-hidden="true" />
        New
        <span className="num ml-auto pl-4">{formatInt(row.newCustomers)}</span>
      </p>
      <p className="flex items-center gap-2">
        <span className="bg-pollen inline-block size-2.5 rounded-sm" aria-hidden="true" />
        Returning
        <span className="num ml-auto pl-4">{formatInt(row.returningCustomers)}</span>
      </p>
    </div>
  );
}

export function CustomersChart({
  series,
  interval,
}: {
  series: CustomersPoint[];
  interval: Interval;
}) {
  const data: Row[] = series.map((p) => ({
    ...p,
    label: interval === 'month' ? formatMonthYear(p.bucket) : formatDayMonth(p.bucket),
  }));
  const newTotal = series.reduce((s, p) => s + p.newCustomers, 0);
  const retTotal = series.reduce((s, p) => s + p.returningCustomers, 0);
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
      <div className="h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={RULE} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: RULE }}
              tick={{ fill: MUTED, fontSize: 12, fontFamily: 'var(--font-archivo)' }}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: MUTED, fontSize: 12, fontFamily: 'var(--font-archivo)' }}
            />
            <Tooltip cursor={{ fill: '#15191C0A' }} content={<TooltipBox />} />
            <Bar dataKey="newCustomers" stackId="c" fill={TIDE} isAnimationActive={false} />
            <Bar
              dataKey="returningCustomers"
              stackId="c"
              fill={POLLEN}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
