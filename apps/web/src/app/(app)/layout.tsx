import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { storeToday } from '@statlume/shared';
import { DateRangeSlot } from '@/components/DateRangeSlot';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { MobileMenu } from '@/components/MobileMenu';
import { NavLinks } from '@/components/NavLinks';
import { UserMenu } from '@/components/UserMenu';
import { Skeleton } from '@/components/states';
import { sessionRole } from '@/lib/session';

// Dashboard pages are private, so keep them out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = (await sessionRole()) === 'admin';
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="bg-ink text-paper sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <aside className="border-rule hidden border-r p-4 lg:block">
        <div className="sticky top-4 grid gap-8">
          <Link href="/overview" aria-label="Statlume overview" className="w-fit rounded-md">
            <Logo />
          </Link>
          <nav aria-label="Main">
            <Suspense fallback={null}>
              <NavLinks isAdmin={isAdmin} />
            </Suspense>
          </nav>
          <p className="text-muted text-sm">
            Reporting on <span className="text-ink font-semibold">Halden Goods</span>
          </p>
        </div>
      </aside>

      <div className="min-w-0 px-4 sm:px-6 lg:px-10">
        <div className="border-rule flex flex-wrap items-center gap-3 border-b py-3">
          <Suspense fallback={null}>
            <MobileMenu isAdmin={isAdmin} />
          </Suspense>
          <Link
            href="/overview"
            aria-label="Statlume overview"
            className="inline-flex min-h-11 items-center rounded-md lg:hidden"
          >
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-3 max-sm:order-last max-sm:ml-0 max-sm:w-full">
            <Suspense fallback={<Skeleton className="h-11 w-56" />}>
              <DateRangeSlot today={storeToday()} />
            </Suspense>
          </div>
          <div className="max-sm:ml-auto">
            <Suspense fallback={<Skeleton className="h-11 w-24" />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
        <main id="main" className="py-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
