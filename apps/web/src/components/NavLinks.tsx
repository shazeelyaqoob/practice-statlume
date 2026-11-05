'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAV, withRange } from './nav';

export function NavLinks({
  isAdmin,
  onNavigate,
  className = '',
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const from = params.get('from');
  const to = params.get('to');
  return (
    <ul className={`grid gap-1 ${className}`}>
      {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
        const active = pathname.startsWith(n.href);
        return (
          <li key={n.href}>
            <Link
              href={withRange(n.href, from, to)}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center rounded-md px-3 font-semibold transition-colors ${
                active ? 'bg-ink text-paper' : 'text-ink hover:bg-ink/5 active:bg-ink/10'
              }`}
            >
              {n.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
