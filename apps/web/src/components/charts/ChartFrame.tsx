import type { ReactNode } from 'react';
import { ChartHover, type HoverRow } from './ChartHover';
import { VB_H, VB_W, yFor } from './scale';

/** At most this many date labels on wide screens, half that on phones. */
const MAX_X_LABELS = 6;

/**
 * Axes, grid lines and the hover layer around a chart drawing. Labels are
 * HTML so they stay 14 px and crisp while the drawing stretches to fit.
 */
export function ChartFrame({
  ticks,
  tickLabel,
  labels,
  axisWidth,
  hoverRows,
  swatch,
  children,
}: {
  ticks: number[];
  tickLabel: (value: number) => string;
  labels: string[];
  axisWidth: number;
  hoverRows: HoverRow[];
  swatch: 'line' | 'box';
  children: ReactNode;
}) {
  const max = ticks.at(-1) ?? 1;
  const n = labels.length;
  const step = Math.max(1, Math.ceil(n / MAX_X_LABELS));
  const shown = labels
    .map((label, i) => ({ label, i }))
    .filter(({ i }) => i % step === 0)
    .map((l, k, all) => ({ ...l, hideOnPhone: all.length > 3 && k % 2 === 1 }));

  return (
    <div className="h-64 pt-2" aria-hidden="true">
      <div className="flex h-55">
        <div className="relative shrink-0" style={{ width: axisWidth }}>
          {ticks.map((t) => (
            <span
              key={t}
              className="num text-muted absolute right-2 -translate-y-1/2 text-sm leading-none"
              style={{ top: `${(1 - t / max) * 100}%` }}
            >
              {tickLabel(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            {ticks.map((t) => (
              <line
                key={t}
                x1={0}
                x2={VB_W}
                y1={yFor(t, max)}
                y2={yFor(t, max)}
                stroke="var(--color-rule)"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {children}
          </svg>
          <ChartHover rows={hoverRows} swatch={swatch} />
        </div>
      </div>
      <div className="relative h-7" style={{ marginLeft: axisWidth }}>
        {shown.map(({ label, i, hideOnPhone }) => {
          const pos = ((i + 0.5) / n) * 100;
          // Labels near an edge line up with that edge so they never stick out.
          const place =
            pos < 10
              ? { className: '', style: { left: 0 } }
              : pos > 90
                ? { className: '', style: { right: 0 } }
                : { className: '-translate-x-1/2', style: { left: `${pos}%` } };
          return (
            <span
              key={i}
              className={[
                'text-muted absolute top-2 text-sm leading-none whitespace-nowrap',
                place.className,
                hideOnPhone ? 'max-sm:hidden' : '',
              ].join(' ')}
              style={place.style}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
