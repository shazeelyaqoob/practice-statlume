import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This page does not exist. Go back to the Statlume start page or the dashboard.',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-xl grid-rows-[1fr_auto] px-4">
      <main className="grid content-center justify-items-start gap-4 py-12">
        <Link
          href="/"
          aria-label="Statlume home"
          className="inline-flex min-h-11 items-center rounded-md"
        >
          <Logo />
        </Link>
        <h1 className="text-4xl font-extrabold">Nothing here.</h1>
        <p className="text-muted">
          This page does not exist. The numbers you want are on the overview.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/overview" className="btn-primary">
            Go to the overview
          </Link>
          <Link href="/" className="btn-quiet">
            Back to the start
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
