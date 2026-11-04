import type { Metadata } from 'next';
import Link from 'next/link';
import { ordersQuerySchema, type OrdersQuery, type OrdersResponse } from '@statlume/shared';
import { ExportLink } from '@/components/ExportLink';
import { OrderFilters } from '@/components/OrderFilters';
import { PageHeader, Section } from '@/components/Section';
import { EmptyState, TableSkeleton } from '@/components/states';
import { apiGet } from '@/lib/api';
import { formatInt, formatMoney, formatRange, formatStoreDateTime } from '@/lib/format';
import { first, qs, readRange, type SearchParams } from '@/lib/range';

export const metadata: Metadata = {
  title: 'Orders',
  description: 'Every Halden Goods order in the date range, with status and channel filters.',
};

const STATUS_STYLE: Record<string, string> = {
  paid: 'border-tide/40 text-tide',
  refunded: 'border-sodium-text/40 text-sodium-text',
  cancelled: 'border-rule-strong text-muted',
};

async function OrdersTable({ query }: { query: OrdersQuery }) {
  const data = await apiGet<OrdersResponse>(`/orders${qs({ ...query })}`);
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  if (data.total === 0) {
    return (
      <EmptyState
        title={`No orders between ${formatRange(query.from, query.to)}`}
        body={query.status || query.channel ? 'Try removing a filter.' : 'Try a wider date range.'}
        resetHref="/orders"
      />
    );
  }
  const firstRow = (data.page - 1) * data.pageSize + 1;
  const lastRow = Math.min(data.total, data.page * data.pageSize);
  const pageHref = (page: number) =>
    qs({ from: query.from, to: query.to, status: query.status, channel: query.channel, page });

  return (
    <div className="grid gap-3">
      <div className="panel overflow-hidden">
        <table className="rtable">
          <caption className="sr-only">
            Orders {firstRow} to {lastRow} of {data.total}, newest first
          </caption>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Date (ET)</th>
              <th scope="col">Customer</th>
              <th scope="col">Channel</th>
              <th scope="col">Status</th>
              <th scope="col" className="r">
                Items
              </th>
              <th scope="col" className="r">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((o) => (
              <tr key={o.id}>
                <td className="lead num" data-label="Order">
                  {o.number}
                </td>
                <td className="num" data-label="Date (ET)">
                  {formatStoreDateTime(o.createdAt)}
                </td>
                <td data-label="Customer">{o.customerName}</td>
                <td className="capitalize" data-label="Channel">
                  {o.channel}
                </td>
                <td data-label="Status">
                  <span
                    className={`w-fit rounded border px-2 py-0.5 text-sm capitalize ${STATUS_STYLE[o.status] ?? ''}`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="r num" data-label="Items">
                  {formatInt(o.items)}
                </td>
                <td className="r num" data-label="Total">
                  {formatMoney(o.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted text-sm">
          Showing <span className="num">{formatInt(firstRow)}</span> to{' '}
          <span className="num">{formatInt(lastRow)}</span> of{' '}
          <span className="num">{formatInt(data.total)}</span> orders
        </p>
        <div className="flex items-center gap-2">
          {data.page > 1 ? (
            <Link href={pageHref(data.page - 1)} className="btn-quiet" rel="prev">
              Previous
            </Link>
          ) : (
            <span className="btn border-rule text-muted" aria-disabled="true">
              Previous
            </span>
          )}
          <span className="num px-2 text-sm">
            Page {data.page} of {pages}
          </span>
          {data.page < pages ? (
            <Link href={pageHref(data.page + 1)} className="btn-quiet" rel="next">
              Next
            </Link>
          ) : (
            <span className="btn border-rule text-muted" aria-disabled="true">
              Next
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const range = readRange(params);
  const parsed = ordersQuerySchema.safeParse({
    ...range,
    status: first(params.status) || undefined,
    channel: first(params.channel) || undefined,
    page: first(params.page) ?? 1,
  });
  const query: OrdersQuery = parsed.success ? parsed.data : { ...range, page: 1, pageSize: 25 };

  return (
    <>
      <PageHeader title="Orders">
        Every order placed between {formatRange(query.from, query.to)}, newest first.
      </PageHeader>
      <Section
        id="orders"
        title="Order list"
        actions={
          <>
            <OrderFilters status={query.status} channel={query.channel} />
            <ExportLink
              report="orders"
              params={{
                from: query.from,
                to: query.to,
                status: query.status,
                channel: query.channel,
              }}
            />
          </>
        }
        fallback={<TableSkeleton rows={12} />}
      >
        <OrdersTable query={query} />
      </Section>
    </>
  );
}
