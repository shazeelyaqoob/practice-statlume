import type { Metadata } from 'next';
import Link from 'next/link';
import {
  INTERVALS,
  STORE_TZ_LABEL,
  defaultInterval,
  type Interval,
  type SalesResponse,
} from '@statlume/shared';
import { SalesChart } from '@/components/charts/LazyCharts';
import { KpiGrid } from '@/components/KpiGrid';
import { PageHeader, Section } from '@/components/Section';
import { EmptyState, KpiSkeleton, SectionSkeleton } from '@/components/states';
import { apiGet } from '@/lib/api';
import { formatRange } from '@/lib/format';
import { first, qs, readRange, type SearchParams } from '@/lib/range';

export const metadata: Metadata = {
  title: 'Overview',
  description: 'Revenue, orders, average order value and returning customers for Halden Goods.',
};

async function Charts({ from, to, interval }: { from: string; to: string; interval: Interval }) {
  const s = await apiGet<SalesResponse>(`/reports/sales${qs({ from, to, interval })}`);
  if (s.current.every((p) => p.orders === 0)) {
    return (
      <EmptyState
        title={`No orders between ${formatRange(from, to)}`}
        body="Try a wider range. The demo store has a year of history."
        resetHref="/overview"
      />
    );
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SalesChart title="Net revenue" metric="revenue" {...s} />
      <SalesChart title="Orders" metric="orders" {...s} />
    </div>
  );
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { from, to } = readRange(params);
  const requested = first(params.interval);
  const interval = (INTERVALS as readonly string[]).includes(requested ?? '')
    ? (requested as Interval)
    : defaultInterval(from, to);

  return (
    <>
      <PageHeader title="Overview">
        {formatRange(from, to)}. All times in {STORE_TZ_LABEL}.
      </PageHeader>
      <div className="grid gap-8">
        <Section id="kpis" title="Key numbers" fallback={<KpiSkeleton />}>
          <KpiGrid from={from} to={to} />
        </Section>
        <Section
          id="sales"
          title="Sales over time"
          description="Shaded line is this period, dashed line is the period before."
          actions={
            <nav aria-label="Chart grouping" className="flex gap-1">
              {INTERVALS.map((i) => (
                <Link
                  key={i}
                  href={qs({ from, to, interval: i })}
                  aria-current={i === interval ? 'true' : undefined}
                  scroll={false}
                  className={`btn min-w-16 px-3 capitalize ${
                    i === interval
                      ? 'border-ink bg-ink text-paper'
                      : 'border-rule-strong hover:border-ink'
                  }`}
                >
                  {i}
                </Link>
              ))}
            </nav>
          }
          fallback={<SectionSkeleton height="h-80" label="Loading charts" />}
        >
          <Charts from={from} to={to} interval={interval} />
        </Section>
      </div>
    </>
  );
}
