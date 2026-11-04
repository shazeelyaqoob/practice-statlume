import type { KpiValue, KpisResponse } from '@statlume/shared';
import { apiGet } from '@/lib/api';
import {
  formatChange,
  formatInt,
  formatMoney,
  formatMoneyWhole,
  formatPercent,
  formatRange,
} from '@/lib/format';
import { qs } from '@/lib/range';

/** A drop of more than this (percent, or points for rates) is flagged in Sodium. */
const ALERT_DROP = 10;

function Kpi({
  label,
  value,
  kpi,
  unit = '%',
}: {
  label: string;
  value: string;
  kpi: KpiValue;
  unit?: '%' | 'pts';
}) {
  const alert = kpi.change !== null && kpi.change <= -ALERT_DROP;
  const tone =
    kpi.change === null || kpi.change === 0
      ? 'text-muted'
      : kpi.change > 0
        ? 'text-tide'
        : 'text-sodium-text';
  return (
    <div className="bg-panel relative grid content-start gap-1 p-4 sm:p-5">
      {alert ? (
        <span
          className="bg-sodium absolute top-4 right-4 size-2.5 rounded-full sm:top-5 sm:right-5"
          aria-hidden="true"
        />
      ) : null}
      <p className="text-muted text-sm">{label}</p>
      <p className="num text-2xl font-medium sm:text-3xl">{value}</p>
      <p className={`num text-sm ${tone}`}>
        {formatChange(kpi.change, unit)}
        {alert ? <span className="sr-only"> (large drop)</span> : null}
      </p>
    </div>
  );
}

export async function KpiGrid({ from, to }: { from: string; to: string }) {
  const k = await apiGet<KpisResponse>(`/reports/kpis${qs({ from, to })}`);
  return (
    <div>
      <div className="bg-rule grid grid-cols-2 gap-px overflow-hidden rounded-lg lg:grid-cols-4">
        <Kpi label="Net revenue" value={formatMoneyWhole(k.revenue.current)} kpi={k.revenue} />
        <Kpi label="Orders" value={formatInt(k.orders.current)} kpi={k.orders} />
        <Kpi
          label="Average order"
          value={formatMoney(k.averageOrderValue.current)}
          kpi={k.averageOrderValue}
        />
        <Kpi
          label="Returning customers"
          value={formatPercent(k.returningRate.current)}
          kpi={k.returningRate}
          unit="pts"
        />
      </div>
      <p className="text-muted mt-2 text-sm">
        Compared with {formatRange(k.previousRange.from, k.previousRange.to)}.
      </p>
    </div>
  );
}
