'use client';

import { formatSeconds } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownBarProps {
  secondsRemaining: number;
  totalSeconds: number;
  progress: number; // 0 to 1
  isAmberThreshold?: boolean;
}

export function CountdownBar({
  secondsRemaining,
  totalSeconds,
  progress,
  isAmberThreshold = secondsRemaining <= 15,
}: CountdownBarProps) {
  const percent = Math.round(progress * 100);

  return (
    <div className="w-full">
      {/* Timer and status label */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-2">
        <div className="flex items-center gap-1.5">
          {isAmberThreshold ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          ) : (
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          )}
          <span
            className={`font-semibold tracking-tight ${
              isAmberThreshold
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {isAmberThreshold ? 'Hurry! ' : 'Reading Time: '}
            <span className="font-mono text-base">{formatSeconds(secondsRemaining)}</span>
          </span>
        </div>

        <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
          {secondsRemaining}s / {totalSeconds}s
        </span>
      </div>

      {/* Progress track */}
      <div
        role="progressbar"
        aria-valuenow={secondsRemaining}
        aria-valuemin={0}
        aria-valuemax={totalSeconds}
        aria-label="Reading time remaining"
        className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
      >
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            isAmberThreshold
              ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
              : 'bg-indigo-600 dark:bg-indigo-500 shadow-sm shadow-indigo-600/30'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
