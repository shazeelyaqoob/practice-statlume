/**
 * One order on two clocks. 03:30 UTC on 8 March is 22:30 on 7 March in New
 * York, so Statlume counts it on 7 March.
 *
 * Drawn on a narrow canvas so the labels stay readable on a phone.
 */
const LEFT = 84; // where the day bars start
const RIGHT = 352;
const HOUR = 9; // px per hour
const UTC_MIDNIGHT = 168; // 00:00 UTC on 8 March
const NY_MIDNIGHT = UTC_MIDNIGHT + 5 * HOUR; // New York is 5 hours behind in March before the change
const ORDER_X = UTC_MIDNIGHT + 3.5 * HOUR;

const TRACKS = [
  { y: 52, label: 'UTC', midnight: UTC_MIDNIGHT, time: '03:30', timeY: 30 },
  { y: 120, label: 'New York', midnight: NY_MIDNIGHT, time: '22:30', timeY: 158 },
];

export function TimezoneDiagram() {
  return (
    <figure className="bg-paper border-rule max-w-md rounded-lg border p-4 sm:p-5">
      <svg
        viewBox="0 0 360 196"
        className="block h-auto w-full"
        role="img"
        aria-labelledby="tz-title tz-desc"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        <title id="tz-title">One order, two clocks</title>
        <desc id="tz-desc">
          An order at 03:30 UTC on 8 March is 22:30 on 7 March in New York. Statlume counts it on 7
          March.
        </desc>

        {TRACKS.map((t) => (
          <g key={t.label}>
            <text x="0" y={t.y + 5} fontSize="14" fill="#5E686D">
              {t.label}
            </text>
            {/* 7 March and 8 March on this clock */}
            <rect
              x={LEFT}
              y={t.y - 14}
              width={t.midnight - LEFT}
              height="28"
              rx="3"
              fill="#15191C14"
            />
            <rect
              x={t.midnight}
              y={t.y - 14}
              width={RIGHT - t.midnight}
              height="28"
              rx="3"
              fill="#FFFFFF"
              stroke="#15191C1F"
            />
            <text x={LEFT + 8} y={t.y + 5} fontSize="14" fill="#15191C">
              7 Mar
            </text>
            <text x={RIGHT - 8} y={t.y + 5} fontSize="14" fill="#15191C" textAnchor="end">
              8 Mar
            </text>
            <line
              x1={t.midnight}
              y1={t.y - 18}
              x2={t.midnight}
              y2={t.y + 18}
              stroke="#15191C"
              strokeWidth="1.5"
            />
            <text
              x={ORDER_X}
              y={t.timeY}
              fontSize="14"
              fill="#15191C"
              fontWeight="600"
              textAnchor="middle"
            >
              {t.time}
            </text>
          </g>
        ))}

        <line
          x1={ORDER_X}
          y1="36"
          x2={ORDER_X}
          y2="136"
          stroke="#127C7A"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <circle cx={ORDER_X} cy="52" r="6" fill="#127C7A" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx={ORDER_X} cy="120" r="6" fill="#127C7A" stroke="#FFFFFF" strokeWidth="2" />

        <text x="0" y="188" fontSize="14" fill="#15191C" fontWeight="600">
          Counted on 7 March, when the customer ordered.
        </text>
      </svg>
    </figure>
  );
}
