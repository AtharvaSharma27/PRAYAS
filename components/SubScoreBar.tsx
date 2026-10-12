'use client';

interface SubScoreBarProps {
  label: string;
  score: number; // 1 to 10
  description: string;
}

export function SubScoreBar({ label, score, description }: SubScoreBarProps) {
  const percent = Math.min(100, Math.max(10, score * 10));

  let barColor = 'bg-rose-500';
  let badgeColor = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60';

  if (score >= 7) {
    barColor = 'bg-emerald-500';
    badgeColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60';
  } else if (score >= 4) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60';
  }

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {label}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        </div>

        <span
          className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border ${badgeColor}`}
        >
          {score}/10
        </span>
      </div>

      <div className="mt-3">
        <div
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-label={`${label} sub-score`}
          className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
