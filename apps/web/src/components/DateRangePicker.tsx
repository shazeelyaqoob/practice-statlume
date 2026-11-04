'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  MAX_RANGE_DAYS,
  PRESETS,
  STORE_TZ_LABEL,
  dateRangeSchema,
  matchPreset,
  presetRange,
  type PresetId,
} from '@statlume/shared';
import { formatRange } from '@/lib/format';

/**
 * The date range lives in the URL (?from=&to=), so every page reads the same
 * range, links can be shared and the back button works.
 */
export function DateRangePicker({ from, to, today }: { from: string; to: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const active = matchPreset(from, to, today);

  const toggle = () => {
    if (!open) {
      // Start the custom fields from the range currently shown.
      setCustomFrom(from);
      setCustomTo(to);
      setError(null);
    }
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const go = (range: { from: string; to: string }) => {
    const next = new URLSearchParams(params);
    next.set('from', range.from);
    next.set('to', range.to);
    next.delete('page'); // a new range starts again at page 1
    setOpen(false);
    setError(null);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  const applyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = dateRangeSchema.safeParse({ from: customFrom, to: customTo });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the dates');
      return;
    }
    go(parsed.data);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        className="btn-quiet num justify-start text-left text-sm font-medium"
      >
        <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
          <rect
            x="3"
            y="4"
            width="14"
            height="13"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span className="sr-only">Date range: </span>
        <span>{formatRange(from, to)}</span>
        {pending ? <span className="text-muted font-sans">Updating…</span> : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose a date range"
          className="panel border-rule-strong absolute right-0 z-30 mt-2 grid w-[min(22rem,calc(100vw-2rem))] gap-4 border p-4 shadow-[0_12px_32px_-12px_#15191c40] max-sm:left-0 max-sm:right-auto"
        >
          <div>
            <p className="label">Quick ranges</p>
            <ul className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => go(presetRange(p.id as PresetId, today))}
                    aria-pressed={active === p.id}
                    className={`btn w-full justify-start px-3 ${
                      active === p.id
                        ? 'border-ink bg-ink text-paper'
                        : 'border-rule-strong hover:border-ink'
                    }`}
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={applyCustom} className="border-rule grid gap-3 border-t pt-4" noValidate>
            <p className="label mb-0">Custom range</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`${panelId}-from`} className="text-muted mb-1 block text-sm">
                  From
                </label>
                <input
                  id={`${panelId}-from`}
                  type="date"
                  className="field num text-sm"
                  value={customFrom}
                  max={today}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`${panelId}-to`} className="text-muted mb-1 block text-sm">
                  To
                </label>
                <input
                  id={`${panelId}-to`}
                  type="date"
                  className="field num text-sm"
                  value={customTo}
                  max={today}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </div>
            {error ? (
              <p role="alert" className="text-sodium-text text-sm">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn-primary">
              Apply
            </button>
            <p className="text-muted text-sm">
              Up to {MAX_RANGE_DAYS} days. All dates in {STORE_TZ_LABEL}.
            </p>
          </form>
        </div>
      ) : null}
    </div>
  );
}
