import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { DemoButtons } from '@/components/landing/DemoButtons';
import { HeroSheet } from '@/components/landing/HeroSheet';
import {
  CustomersPreview,
  OrdersPreview,
  OverviewPreview,
  ProductsPreview,
} from '@/components/landing/MiniPreviews';
import { TimezoneDiagram } from '@/components/landing/TimezoneDiagram';

const REPO = 'https://github.com/shazeelyaqoob/practice-statlume';

export const metadata: Metadata = {
  title: { absolute: 'Statlume · Store analytics that reads like a report' },
  description:
    'Revenue, products, customers and orders for any date range, each compared with the period before. Try the demo store in one click.',
  alternates: { canonical: '/' },
};

const REPORTS: {
  n: string;
  question: string;
  report: string;
  answer: string;
  points: string[];
  preview: ReactNode;
}[] = [
  {
    n: '01',
    question: 'What did we sell?',
    report: 'Overview',
    answer:
      'Net revenue, orders, average order and returning customers, next to the same numbers for the period before.',
    points: ['Day, week or month view', 'Refunds taken off, not hidden'],
    preview: <OverviewPreview />,
  },
  {
    n: '02',
    question: 'What is carrying the month?',
    report: 'Products',
    answer:
      'Every product ranked by units, revenue after discounts and refunds, and its share of the total.',
    points: ['Sort by any column', 'Search keeps the true share'],
    preview: <ProductsPreview />,
  },
  {
    n: '03',
    question: 'Are people coming back?',
    report: 'Customers',
    answer:
      'New against returning customers over time, the repeat purchase rate, and who spent the most.',
    points: ['Returning means ordered before', 'Full list in the export'],
    preview: <CustomersPreview />,
  },
  {
    n: '04',
    question: 'What happened to that order?',
    report: 'Orders',
    answer:
      'Every order in the range, newest first, with status and channel filters and page by page browsing.',
    points: ['Paid, refunded, cancelled', 'Export exactly what you filtered'],
    preview: <OrdersPreview />,
  },
];

const COLOURS = [
  {
    name: 'Tide',
    swatch: 'bg-tide',
    rule: 'This period, and anything going up.',
    sample: <span className="num text-tide font-medium">+12.4%</span>,
  },
  {
    name: 'Pollen',
    swatch: 'bg-pollen',
    rule: 'The period before, so you always have something to compare with.',
    sample: (
      <svg viewBox="0 0 64 8" className="h-2 w-16" aria-hidden="true">
        <line
          x1="0"
          y1="4"
          x2="64"
          y2="4"
          stroke="#E5B92B"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
      </svg>
    ),
  },
  {
    name: 'Sodium',
    swatch: 'bg-sodium',
    rule: 'Only when a number drops by more than 10%. If you see orange, look.',
    sample: (
      <span className="flex items-center gap-1.5">
        <span className="bg-sodium size-2.5 rounded-full" aria-hidden="true" />
        <span className="num text-sodium-text font-medium">−14.0%</span>
      </span>
    ),
  },
  {
    name: 'Ink on paper',
    swatch: 'bg-ink',
    rule: 'Everything else. Numbers line up in columns, like a printed report.',
    sample: <span className="num font-medium">$48,210.00</span>,
  },
];

const STACK: { term: string; detail: ReactNode }[] = [
  {
    term: 'Front end',
    detail: 'Next.js App Router with Server Components, TypeScript, Tailwind CSS and Recharts.',
  },
  {
    term: 'API',
    detail: 'A separate Node.js and Express 5 service in TypeScript. Every input checked with zod.',
  },
  {
    term: 'Database',
    detail: 'MySQL 8.4 with hand-written SQL: joins, group by, window functions, no ORM.',
  },
  {
    term: 'Sign-in',
    detail:
      'Passwords hashed with argon2. 15 minute access tokens and rotating refresh tokens in httpOnly cookies. A stolen refresh token signs out every session.',
  },
  {
    term: 'Roles',
    detail: 'Admins manage users, viewers read reports. Checked by the API on every request.',
  },
  {
    term: 'Exports',
    detail:
      'CSV files streamed straight from MySQL, so a large export never sits in memory. Safe against spreadsheet formula injection.',
  },
  {
    term: 'Speed',
    detail: (
      <>
        On 500,000 orders, one index took the orders list from{' '}
        <span className="num font-semibold">63 ms</span> to{' '}
        <span className="num font-semibold">1.2 ms</span>.{' '}
        <a
          href={`${REPO}/blob/main/docs/INDEX_STORY.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Read how it was measured<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </>
    ),
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Statlume',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Store analytics dashboard: revenue, products, customers and orders for any date range, compared with the period before.',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

function SectionHead({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-1 text-3xl leading-tight font-extrabold sm:text-4xl">
        {title}
      </h2>
      {children ? <div className="text-muted mt-3 text-lg">{children}</div> : null}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <a
        href="#main"
        className="bg-ink text-paper sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <header className="border-rule border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Statlume home"
            className="inline-flex min-h-11 items-center rounded-md"
          >
            <Logo />
          </Link>
          <nav aria-label="Page sections" className="hidden md:block">
            <ul className="flex gap-1">
              {[
                ['#reports', 'Reports'],
                ['#reading', 'How to read it'],
                ['#build', 'How it is built'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="hover:bg-ink/5 inline-flex min-h-11 items-center rounded-md px-3 font-semibold"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="btn-quiet max-[380px]:hidden">
              Log in
            </Link>
            <Link href="/login" className="btn-primary">
              Try the demo
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20 lg:pb-24"
        >
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="eyebrow flex flex-wrap items-center gap-x-2">
                <span>Store analytics</span>
                <span aria-hidden="true">·</span>
                <span>Demo with a fictional shop</span>
              </p>
              <h1
                id="hero-title"
                className="mt-3 text-5xl leading-[1.02] font-extrabold tracking-[-0.03em] sm:text-6xl lg:text-7xl"
              >
                Know what sold today.
              </h1>
              <p className="text-muted mt-6 max-w-lg text-lg sm:text-xl">
                Statlume turns a year of orders into four plain reports. Every number sits next to
                the period before, so you see what changed, not just what happened.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login" className="btn-primary px-6 text-base">
                  Try the demo
                </Link>
                <a href="#reports" className="btn-quiet px-6 text-base">
                  See the reports
                </a>
              </div>
              <p className="text-muted mt-3 text-sm">
                One click, no sign-up. Pick admin or viewer.
              </p>

              <dl className="border-rule mt-10 grid max-w-md grid-cols-3 border-t pt-4">
                {[
                  ['Orders', '10,000'],
                  ['Customers', '4,000'],
                  ['History', '12 months'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted text-sm">{label}</dt>
                    <dd className="num text-xl font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroSheet />
          </div>
        </section>

        {/* Reports, written as the questions they answer */}
        <section
          id="reports"
          aria-labelledby="reports-title"
          className="border-rule scroll-mt-4 border-t"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <SectionHead
              id="reports-title"
              eyebrow="Four reports"
              title="Four questions, answered every morning."
            >
              Each report is one page with one job. Pick a date range once and every page follows
              it.
            </SectionHead>
            <ol className="border-ink mt-12 border-t">
              {REPORTS.map((r) => (
                <li
                  key={r.n}
                  className="border-rule grid gap-x-8 gap-y-4 border-b py-8 md:grid-cols-[4rem_minmax(0,1fr)_14rem] md:items-center lg:grid-cols-[5rem_minmax(0,1fr)_16rem]"
                >
                  <span className="num text-muted text-lg font-medium" aria-hidden="true">
                    {r.n}
                  </span>
                  <div>
                    <h3 className="text-2xl font-extrabold">{r.question}</h3>
                    <p className="mt-1 font-semibold">{r.report}</p>
                    <p className="text-muted mt-2 max-w-xl">{r.answer}</p>
                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      {r.points.map((p) => (
                        <li key={p} className="flex items-center gap-2">
                          <span className="bg-tide size-1.5 rounded-full" aria-hidden="true" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="panel max-w-64 p-4 md:max-w-none">{r.preview}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* How to read it */}
        <section
          id="reading"
          aria-labelledby="reading-title"
          className="bg-panel border-rule scroll-mt-4 border-t"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <SectionHead
                  id="reading-title"
                  eyebrow="How to read it"
                  title="Three colours. One job each."
                >
                  Most dashboards shout in every colour. Statlume looks like a well printed report,
                  so the one thing that needs you stands out.
                </SectionHead>
                <ul className="border-ink mt-10 border-t">
                  {COLOURS.map((c) => (
                    <li
                      key={c.name}
                      className="border-rule grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-b py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_7rem] sm:items-center"
                    >
                      <span
                        className={`${c.swatch} block h-10 w-10 rounded-md`}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-muted">{c.rule}</p>
                      </div>
                      <div className="col-start-2 mt-2 sm:col-start-auto sm:mt-0 sm:justify-self-end">
                        {c.sample}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:pt-24">
                <h3 className="text-2xl font-extrabold">Days end at the shop&apos;s midnight.</h3>
                <p className="text-muted mt-3 max-w-lg">
                  Orders are saved in UTC, but a shop thinks in its own time. Statlume groups every
                  report by the store&apos;s local day, including the nights the clocks change.
                </p>
                <div className="mt-6">
                  <TimezoneDiagram />
                </div>
                <p className="text-muted mt-4 max-w-lg text-sm">
                  A dashboard that groups by UTC day would put this late evening order on the wrong
                  date, and every daily total would be slightly off.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it is built */}
        <section
          id="build"
          aria-labelledby="build-title"
          className="border-rule scroll-mt-4 border-t"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-8 lg:py-24">
            <div>
              <SectionHead
                id="build-title"
                eyebrow="How it is built"
                title="A full stack app, not a template."
              >
                A Next.js front end, a separate Express API and a MySQL database, with the SQL
                written by hand and the slow parts measured.
              </SectionHead>
              <a href={REPO} target="_blank" rel="noopener noreferrer" className="btn-quiet mt-8">
                Read the code on GitHub<span className="sr-only"> (opens in a new tab)</span>
                <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                  <path
                    d="M5 11L11 5M6 5h5v5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </a>
            </div>
            <dl className="border-ink border-t">
              {STACK.map((s) => (
                <div
                  key={s.term}
                  className="border-rule grid gap-1 border-b py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6"
                >
                  <dt className="font-semibold">{s.term}</dt>
                  <dd className="text-muted">{s.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing call to action */}
        <section aria-labelledby="cta-title" className="bg-ink text-paper">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8 lg:py-20">
            <div className="max-w-xl">
              <h2 id="cta-title" className="text-3xl leading-tight font-extrabold sm:text-4xl">
                See it with a year of orders.
              </h2>
              <p className="text-paper/80 mt-3 text-lg">
                The demo shop has 10,000 orders across 12 months, with a holiday rush and a quiet
                January, so every chart has a story to tell.
              </p>
            </div>
            <DemoButtons tone="dark" />
          </div>
        </section>
      </main>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 pt-6 text-sm">
          <Link
            href="/login"
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-1 font-semibold hover:underline"
          >
            Log in
          </Link>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-1 font-semibold hover:underline"
          >
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </nav>
        <Footer className="mt-2" />
      </div>
    </>
  );
}
