'use client';

import { useSearchParams } from 'next/navigation';
import { checkRange, presetRange } from '@statlume/shared/client';
import { DateRangePicker } from './DateRangePicker';

/** Reads the range from the URL for the picker in the top bar. */
export function DateRangeSlot({ today }: { today: string }) {
  const params = useSearchParams();
  const from = params.get('from');
  const to = params.get('to');
  const range = from && to && !checkRange(from, to) ? { from, to } : presetRange('30d', today);
  return <DateRangePicker from={range.from} to={range.to} today={today} />;
}
