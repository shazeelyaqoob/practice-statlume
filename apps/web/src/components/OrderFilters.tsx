'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { CHANNELS, ORDER_STATUSES } from '@statlume/shared';

/** Status and channel filters. Changing one updates the URL straight away. */
export function OrderFilters({ status, channel }: { status?: string; channel?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: 'status' | 'channel', value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-end gap-2" aria-busy={pending}>
      <div>
        <label htmlFor="filter-status" className="text-muted mb-1 block text-sm">
          Status
        </label>
        <select
          id="filter-status"
          className="field w-36 capitalize"
          value={status ?? ''}
          onChange={(e) => update('status', e.target.value)}
        >
          <option value="">All</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-channel" className="text-muted mb-1 block text-sm">
          Channel
        </label>
        <select
          id="filter-channel"
          className="field w-36 capitalize"
          value={channel ?? ''}
          onChange={(e) => update('channel', e.target.value)}
        >
          <option value="">All</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {pending ? <span className="text-muted pb-3 text-sm">Updating…</span> : null}
    </div>
  );
}
