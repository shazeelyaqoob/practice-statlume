import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PRODUCT_SORTS,
  productsQuerySchema,
  type ProductRow,
  type ProductSort,
} from '@statlume/shared';
import { ExportLink } from '@/components/ExportLink';
import { PageHeader, Section } from '@/components/Section';
import { EmptyState, TableSkeleton } from '@/components/states';
import { apiGet } from '@/lib/api';
import { formatInt, formatMoney, formatPercent, formatRange } from '@/lib/format';
import { first, qs, readRange, type SearchParams } from '@/lib/range';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Units sold, net revenue and refunds per product for Halden Goods.',
};

const COLUMNS: { key: ProductSort; label: string; numeric: boolean }[] = [
  { key: 'title', label: 'Product', numeric: false },
  { key: 'units', label: 'Units sold', numeric: true },
  { key: 'revenue', label: 'Net revenue', numeric: true },
  { key: 'refunds', label: 'Refunded units', numeric: true },
];

interface Query {
  from: string;
  to: string;
  sort: ProductSort;
  dir: 'asc' | 'desc';
  q?: string;
}

async function ProductsTable({ query }: { query: Query }) {
  const { rows } = await apiGet<{ rows: ProductRow[] }>(
    `/reports/products${qs({ ...query, limit: 100 })}`,
  );
  if (rows.length === 0) {
    return query.q ? (
      <EmptyState
        title={`No products match “${query.q}”`}
        body="Check the spelling, or clear the search."
      />
    ) : (
      <EmptyState
        title={`No sales between ${formatRange(query.from, query.to)}`}
        body="Try a wider date range."
        resetHref="/products"
      />
    );
  }

  const sortHref = (key: ProductSort) => {
    const dir =
      query.sort === key
        ? query.dir === 'desc'
          ? 'asc'
          : 'desc'
        : key === 'title'
          ? 'asc'
          : 'desc';
    return qs({ from: query.from, to: query.to, q: query.q, sort: key, dir });
  };

  return (
    <div className="panel overflow-hidden">
      <table className="rtable">
        <caption className="sr-only">
          Products sorted by {query.sort}, {query.dir === 'desc' ? 'highest' : 'lowest'} first
        </caption>
        <thead>
          <tr>
            {COLUMNS.map((c) => {
              const active = query.sort === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={c.numeric ? 'r' : ''}
                  aria-sort={active ? (query.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <Link
                    href={sortHref(c.key)}
                    scroll={false}
                    className={`hover:text-ink inline-flex min-h-11 items-center gap-1 ${active ? 'text-ink' : ''}`}
                  >
                    {c.label}
                    <span aria-hidden="true" className="w-3">
                      {active ? (query.dir === 'asc' ? '↑' : '↓') : ''}
                    </span>
                  </Link>
                </th>
              );
            })}
            <th scope="col" className="r">
              Share of revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.productId}>
              <td className="lead" data-label="Product">
                <span className="block">{r.title}</span>
                <span className="text-muted text-sm font-normal">{r.category}</span>
              </td>
              <td className="r num" data-label="Units sold">
                {formatInt(r.units)}
              </td>
              <td className="r num" data-label="Net revenue">
                {formatMoney(r.revenue)}
              </td>
              <td className="r num" data-label="Refunded units">
                {formatInt(r.refunds)}
              </td>
              <td className="r" data-label="Share of revenue">
                <span className="inline-flex items-center gap-2 md:justify-end">
                  <span
                    className="bg-rule hidden h-1.5 w-16 overflow-hidden rounded sm:block"
                    aria-hidden="true"
                  >
                    <span
                      className="bg-tide block h-full"
                      style={{ width: `${Math.min(100, r.share * 4)}%` }}
                    />
                  </span>
                  <span className="num">{formatPercent(r.share)}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const range = readRange(params);
  const parsed = productsQuerySchema.safeParse({
    ...range,
    sort: first(params.sort),
    dir: first(params.dir),
    q: first(params.q) || undefined,
  });
  const query: Query = parsed.success
    ? {
        from: parsed.data.from,
        to: parsed.data.to,
        sort: parsed.data.sort,
        dir: parsed.data.dir,
        q: parsed.data.q || undefined,
      }
    : { ...range, sort: 'revenue', dir: 'desc' };
  // Keep only known sort keys in links built from this query.
  if (!(PRODUCT_SORTS as readonly string[]).includes(query.sort)) query.sort = 'revenue';

  return (
    <>
      <PageHeader title="Products">
        Best sellers for {formatRange(query.from, query.to)}. Revenue is after discounts and
        refunds.
      </PageHeader>
      <Section
        id="top-products"
        title="Top products"
        description="Click a column name to sort."
        actions={
          <>
            <form role="search" className="flex gap-2" action="/products">
              <input type="hidden" name="from" value={query.from} />
              <input type="hidden" name="to" value={query.to} />
              <input type="hidden" name="sort" value={query.sort} />
              <input type="hidden" name="dir" value={query.dir} />
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <input
                id="product-search"
                name="q"
                type="search"
                defaultValue={query.q}
                placeholder="Search products"
                className="field w-48 sm:w-56"
                maxLength={80}
              />
              <button type="submit" className="btn-quiet">
                Search
              </button>
            </form>
            <ExportLink report="products" params={{ ...query }} />
          </>
        }
        fallback={<TableSkeleton rows={10} />}
      >
        <ProductsTable query={query} />
      </Section>
    </>
  );
}
