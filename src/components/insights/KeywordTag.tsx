'use client';

import { intentColorMap, intentLabels, IntentCategory } from '@/data/funeralKeywords';
import { cn } from '@/lib/utils';

type KeywordTagProps = {
  intent: IntentCategory;
};

export function KeywordTag({ intent }: KeywordTagProps) {
  const label = intentLabels[intent];
  const palette = intentColorMap[intent];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-sm',
        palette,
      )}
    >
      {label}
    </span>
  );
}
