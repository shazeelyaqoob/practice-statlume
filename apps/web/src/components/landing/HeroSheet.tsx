import { Mark } from '../Logo';
import { areaPath, linePath } from './chartPath';

// Illustrative numbers in the style of the brand book mock-up. Not live data.
const THIS_PERIOD = [42, 46, 44, 52, 50, 58, 55, 63, 60, 68, 66, 74, 71, 80];
const PERIOD_BEFORE = [38, 41, 40, 44, 43, 47, 46, 49, 48, 52, 51, 54, 53, 57];
const SCALE = { width: 320, height: 120, min: 30, max: 84 };

const KPIS = [
  { label: 'Net revenue', value: '$48,210', change: '+12.4%', up: true },
  { label: 'Orders', value: '1,284', change: '+8.1%', up: true },
  { label: 'Average order', value: '$37.55', change: '−2.3%', up: false },
  { label: 'Returning', value: '31.2%', change: '+4.0 pts', up: true },
];

/**
 * The hero picture: one page of a Statlume report, drawn in HTML and SVG
 * (no screenshot), so it is sharp at any size and costs no image download.
 */
export function HeroSheet() {
  return (
    <figure
      className="relative mx-auto w-full max-w-[34rem] lg:mx-0"
      aria-labelledby="hero-sheet-caption"
    >
      {/* The sheet underneath, like a stack of printed pages. */}
      <div
        className="bg-panel border-rule-strong absolute inset-0 translate-x-3 translate-y-3 rounded-lg border"
        aria-hidden="true"
      />
      <div className="bg-paper border-ink relative overflow-hidden rounded-lg border">
        <div className="border-rule flex items-center justify-between gap-3 border-b px-4 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <Mark className="size-5" />
            Halden Goods
          </span>
          <span className="num border-rule-strong rounded-md border px-2 py-0.5 text-sm">
            1 Oct to 31 Oct
          </span>
        </div>

        <dl className="bg-rule m-4 grid grid-cols-2 gap-px overflow-hidden rounded-md">
          {KPIS.map((k) => (
            <div key={k.label} className="bg-panel grid gap-0.5 p-3">
              <dt className="text-muted text-sm">{k.label}</dt>
              <dd className="num text-xl font-medium sm:text-2xl">{k.value}</dd>
              <dd className={`num text-sm ${k.up ? 'text-tide' : 'text-sodium-text'}`}>
                {k.change}
              </dd>
            </div>
          ))}
        </dl>

        <div className="bg-panel mx-4 rounded-md p-3">
          <svg viewBox="0 0 320 120" className="block h-auto w-full" aria-hidden="true">
            <g stroke="#15191C14">
              <line x1="0" y1="30" x2="320" y2="30" />
              <line x1="0" y1="62" x2="320" y2="62" />
              <line x1="0" y1="94" x2="320" y2="94" />
            </g>
            <path d={areaPath(THIS_PERIOD, SCALE)} fill="#127C7A1F" />
            <path
              d={linePath(PERIOD_BEFORE, SCALE)}
              fill="none"
              stroke="#E5B92B"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <path
              className="draw-line"
              d={linePath(THIS_PERIOD, SCALE)}
              fill="none"
              stroke="#127C7A"
              strokeWidth="2.5"
              strokeLinejoin="round"
              pathLength={1}
            />
          </svg>
          <div className="text-muted mt-2 flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <i className="bg-tide inline-block h-0.75 w-3 rounded" />
              This month
            </span>
            <span className="flex items-center gap-1.5">
              <i className="bg-pollen inline-block h-0.75 w-3 rounded" />
              Last month
            </span>
          </div>
        </div>

        <p className="border-rule mx-4 mt-4 mb-4 flex items-center gap-2 border-t pt-3 text-sm">
          <span className="bg-sodium size-2.5 shrink-0 rounded-full" aria-hidden="true" />
          <span>
            <span className="text-sodium-text font-semibold">Bath is down 12.6%</span> on last
            month. The only orange on the page.
          </span>
        </p>
      </div>
      <figcaption id="hero-sheet-caption" className="sr-only">
        Example report page: net revenue $48,210, up 12.4%. Orders 1,284, up 8.1%. Average order
        $37.55, down 2.3%. Returning customers 31.2%, up 4 points. One alert: Bath is down 12.6%.
      </figcaption>
    </figure>
  );
}
