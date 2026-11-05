import type { Metadata } from 'next';
import type { CustomersResponse, TopCustomerRow } from '@statlume/shared';
import { CustomersChart } from '@/components/charts/CustomersChart';
import { ExportLink } from '@/components/ExportLink';
import { PageHeader, Section } from '@/components/Section';
import { EmptyState, KpiSkeleton, SectionSkeleton, TableSkeleton } from '@/components/states';
import { apiGet } from '@/lib/api';
import { formatInt, formatMoney, formatPercent, formatRange, formatStoreDate } from '@/lib/format';
import { qs, readRange, type SearchParams } from '@/lib/range';

export const metadata: Metadata = {
  title: 'Customers',
  description:
    'New and returning customers, repeat purchase rate and top customers for Halden Goods.',
};

async function CustomerOverview({ from, to }: { from: string; to: string }) {
  const c = await apiGet<CustomersResponse>(`/reports/customers${qs({ from, to })}`);
  if (c.totals.customers === 0) {
    return (
      <EmptyState
        title={`No customers ordered between ${formatRange(from, to)}`}
        body="Try a wider date range."
        resetHref="/customers"
      />
    );
  }
  const stats = [
    { label: 'Customers who ordered', value: formatInt(c.totals.customers) },
    { label: 'New', value: formatInt(c.totals.newCustomers) },
    { label: 'Returning', value: formatInt(c.totals.returningCustomers) },
    { label: 'Ordered 2+ times in range', value: formatPercent(c.totals.repeatRate) },
  ];
  return (
    <div className="grid gap-4">
      <dl className="bg-rule grid grid-cols-2 gap-px overflow-hidden rounded-lg lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-panel grid content-start gap-1 p-4 sm:p-5">
            <dt className="text-muted text-sm">{s.label}</dt>
            <dd className="num text-2xl font-medium">{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted text-sm">
        Returning means they had ordered before. New means this range has their first order ever.
      </p>
      <CustomersChart series={c.series} interval={c.interval} />
    </div>
  );
}

async function TopCustomers({ from, to }: { from: string; to: string }) {
  const { rows } = await apiGet<{ rows: TopCustomerRow[] }>(
    `/reports/top-customers${qs({ from, to, limit: 10 })}`,
  );
  if (rows.length === 0) {
    return <EmptyState title="No customers in this range" />;
  }
  return (
    <div className="panel overflow-hidden">
      <table className="rtable">
        <caption className="sr-only">Top 10 customers by net revenue</caption>
        <thead>
          <tr>
            <th scope="col">Customer</th>
            <th scope="col" className="r">
              Orders
            </th>
            <th scope="col" className="r">
              Net revenue
            </th>
            <th scope="col" className="r">
              Last order
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.customerId}>
              <td className="lead" data-label="Customer">
                <span className="block">{r.name}</span>
                <span className="text-muted text-sm font-normal break-all">{r.email}</span>
              </td>
              <td className="r num" data-label="Orders">
                {formatInt(r.orders)}
              </td>
              <td className="r num" data-label="Net revenue">
                {formatMoney(r.revenue)}
              </td>
              <td className="r num" data-label="Last order">
                {formatStoreDate(r.lastOrderAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { from, to } = readRange(await searchParams);
  return (
    <>
      <PageHeader title="Customers">Who bought between {formatRange(from, to)}.</PageHeader>
      <div className="grid gap-8">
        <Section
          id="customer-mix"
          title="New and returning"
          fallback={
            <div className="grid gap-4">
              <KpiSkeleton />
              <SectionSkeleton height="h-72" label="Loading chart" />
            </div>
          }
        >
          <CustomerOverview from={from} to={to} />
        </Section>
        <Section
          id="top-customers"
          title="Top customers"
          description="The 10 customers who spent the most. The export has everyone."
          actions={<ExportLink report="customers" params={{ from, to }} />}
          fallback={<TableSkeleton rows={10} />}
        >
          <TopCustomers from={from} to={to} />
        </Section>
      </div>
    </>
  );
}
