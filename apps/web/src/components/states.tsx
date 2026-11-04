import Link from 'next/link';
import { SlowNotice } from './SlowNotice';

/** Grey placeholder with the same shape as the final content, so nothing jumps. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** Loading placeholder for one section. Announces itself to screen readers once. */
export function SectionSkeleton({
  height = 'h-64',
  label = 'Loading',
}: {
  height?: string;
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="relative">
      <span className="sr-only">{label}…</span>
      <Skeleton className={`w-full ${height}`} />
      <SlowNotice />
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div role="status" className="relative">
      <span className="sr-only">Loading key numbers…</span>
      <div className="bg-rule grid grid-cols-2 gap-px overflow-hidden rounded-lg lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-panel grid gap-3 p-4 sm:p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <SlowNotice />
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" className="panel relative grid gap-3 p-4">
      <span className="sr-only">Loading table…</span>
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
      <SlowNotice />
    </div>
  );
}

/** Shown when a range has no data. Offers a way out instead of a blank box. */
export function EmptyState({
  title,
  body,
  resetHref,
}: {
  title: string;
  body?: string;
  resetHref?: string;
}) {
  return (
    <div className="panel border-rule-strong grid justify-items-start gap-2 border border-dashed p-6">
      <p className="font-semibold">{title}</p>
      {body ? <p className="text-muted">{body}</p> : null}
      {resetHref ? (
        <Link href={resetHref} className="btn-quiet mt-2">
          Show the last 30 days
        </Link>
      ) : null}
    </div>
  );
}
