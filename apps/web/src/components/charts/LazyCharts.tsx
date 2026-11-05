'use client';

import dynamic from 'next/dynamic';

/**
 * Recharts is the biggest piece of JavaScript in the app. Loading it in its
 * own chunk after the page is interactive keeps the first load light. The
 * placeholder has the chart's exact size, so nothing moves when it arrives.
 */
function ChartPlaceholder() {
  return (
    <div className="panel p-4" role="status">
      <span className="sr-only">Loading chart…</span>
      <div className="skeleton mb-3 h-7 w-56" aria-hidden="true" />
      <div className="skeleton h-64 w-full" aria-hidden="true" />
    </div>
  );
}

export const SalesChart = dynamic(() => import('./SalesChart').then((m) => m.SalesChart), {
  ssr: false,
  loading: ChartPlaceholder,
});

export const CustomersChart = dynamic(
  () => import('./CustomersChart').then((m) => m.CustomersChart),
  { ssr: false, loading: ChartPlaceholder },
);
