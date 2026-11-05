'use client';

import { useState, type PointerEvent } from 'react';

export interface HoverItem {
  name: string;
  value: string;
  color: 'tide' | 'pollen';
  muted?: boolean;
}

export interface HoverRow {
  title?: string;
  items: HoverItem[];
}

const SWATCH = {
  line: 'inline-block h-0.75 w-3 rounded',
  box: 'inline-block size-2.5 rounded-sm',
};
const FILL = { tide: 'bg-tide', pollen: 'bg-pollen' };

/**
 * The only part of a chart that runs in the browser: it works out which bucket
 * the pointer is over and shows that bucket's numbers. The drawing itself is
 * plain SVG from the server, and the text was formatted there too.
 */
export function ChartHover({ rows, swatch }: { rows: HoverRow[]; swatch: 'line' | 'box' }) {
  const [index, setIndex] = useState<number | null>(null);
  const n = rows.length;

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - box.left) / box.width) * n);
    setIndex(Math.min(n - 1, Math.max(0, i)));
  };

  const row = index === null ? undefined : rows[index];

  return (
    <div
      className="absolute inset-0 touch-pan-y"
      onPointerMove={pick}
      onPointerDown={pick}
      onPointerLeave={(e) => {
        // On touch the tooltip stays after the finger lifts, until the next tap.
        if (e.pointerType === 'mouse') setIndex(null);
      }}
    >
      {row && index !== null ? (
        <>
          <div
            className="bg-ink/5 pointer-events-none absolute inset-y-0"
            style={{ left: `${(index / n) * 100}%`, width: `${100 / n}%` }}
          />
          <div
            className="panel border-rule-strong pointer-events-none absolute top-2 z-10 grid w-max gap-1 border px-3 py-2 text-sm shadow-sm"
            style={
              n === 1
                ? { left: 8 }
                : index < n / 2
                  ? { left: `calc(${((index + 1) / n) * 100}% + 8px)` }
                  : { right: `calc(${((n - index) / n) * 100}% + 8px)` }
            }
          >
            {row.title ? <p className="font-semibold">{row.title}</p> : null}
            {row.items.map((item) => (
              <p
                key={item.name}
                className={
                  item.muted ? 'text-muted flex items-center gap-2' : 'flex items-center gap-2'
                }
              >
                <span className={`${SWATCH[swatch]} ${FILL[item.color]}`} />
                {item.name}
                <span className="num ml-auto pl-4 font-medium">{item.value}</span>
              </p>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
