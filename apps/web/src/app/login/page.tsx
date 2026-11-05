import type { Metadata } from 'next';
import Link from 'next/link';
import { first, type SearchParams } from '@/lib/range';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Log in',
  description:
    'Log in to Statlume, a store analytics dashboard. Try it with a one-click demo account.',
  alternates: { canonical: '/login' },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl grid-rows-[1fr_auto] px-4 sm:px-6">
      <main className="grid items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
        <div className="max-w-xl">
          <Link
            href="/"
            aria-label="Statlume home"
            className="inline-flex min-h-11 items-center rounded-md"
          >
            <Logo />
          </Link>
          <h1 className="mt-8 text-4xl leading-[1.05] font-extrabold sm:text-5xl">
            Know what sold today.
          </h1>
          <p className="text-muted mt-4 text-lg">
            Revenue, orders, products and customers for any date range, compared with the period
            before. Reporting on Halden Goods, a fictional home goods shop with a year of orders.
          </p>
          <dl className="border-rule mt-8 grid max-w-md grid-cols-3 border-t pt-4 text-sm">
            <div>
              <dt className="text-muted">Orders</dt>
              <dd className="num text-lg font-medium">10,000</dd>
            </div>
            <div>
              <dt className="text-muted">Customers</dt>
              <dd className="num text-lg font-medium">4,000</dd>
            </div>
            <div>
              <dt className="text-muted">History</dt>
              <dd className="num text-lg font-medium">12 mo</dd>
            </div>
          </dl>
        </div>
        <div className="panel p-5 sm:p-6">
          <LoginForm next={first(params.next)} reason={first(params.reason)} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
