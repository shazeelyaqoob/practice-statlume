'use client';

import { useSearchParams } from 'next/navigation';
import { dateRangeSchema, presetRange } from '@statlume/shared';
import { DateRangePicker } from './DateRangePicker';

/** Reads the range from the URL for the picker in the top bar. */
export function DateRangeSlot({ today }: { today: string }) {
  const params = useSearchParams();
  const parsed = dateRangeSchema.safeParse({ from: params.get('from'), to: params.get('to') });
  const range = parsed.success ? parsed.data : presetRange('30d', today);
  return <DateRangePicker from={range.from} to={range.to} today={today} />;
}
