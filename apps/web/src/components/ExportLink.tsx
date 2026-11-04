import { qs } from '@/lib/range';

/** Plain link, so the browser streams the file to disk while it downloads. */
export function ExportLink({
  report,
  params,
}: {
  report: 'orders' | 'products' | 'customers';
  params: Record<string, string | number | undefined>;
}) {
  return (
    <a href={`/export/${report}.csv${qs(params)}`} className="btn-quiet" download>
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
        <path
          d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 15h12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Export CSV
    </a>
  );
}
