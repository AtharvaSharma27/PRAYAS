'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface WordCounterProps {
  currentCount: number;
  min?: number;
  max?: number;
}

export function WordCounter({
  currentCount,
  min = 20,
  max = 150,
}: WordCounterProps) {
  const isUnderMin = currentCount < min;
  const isOverMax = currentCount > max;

  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      {currentCount === 0 ? (
        <span className="text-slate-400 dark:text-slate-500">
          0 / {min}–{max} words
        </span>
      ) : isUnderMin ? (
        <span
          className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"
          aria-live="polite"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {currentCount} words <span className="hidden sm:inline">(need at least {min - currentCount} more)</span><span className="sm:hidden">({min - currentCount} more)</span>
          </span>
        </span>
      ) : isOverMax ? (
        <span
          className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"
          aria-live="polite"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {currentCount} words <span className="hidden sm:inline">(exceeds {max} limit by {currentCount - max})</span><span className="sm:hidden">(+{currentCount - max})</span>
          </span>
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
          aria-live="polite"
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>
            {currentCount} words <span className="hidden sm:inline">(valid range: {min}–{max})</span><span className="sm:hidden">(valid)</span>
          </span>
        </span>
      )}
    </div>
  );
}
