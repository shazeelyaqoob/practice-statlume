import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-4 px-4">
      <Logo />
      <h1 className="text-4xl font-extrabold">Nothing here.</h1>
      <p className="text-muted">
        This page does not exist. The numbers you want are on the overview.
      </p>
      <Link href="/overview" className="btn-primary w-fit">
        Go to the overview
      </Link>
    </main>
  );
}
