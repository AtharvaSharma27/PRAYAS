'use client';

import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number; // 1 to 10
}

export function ScoreRing({ score }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Smooth score increment
    const duration = 900;
    const steps = 30;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current * 10) / 10);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Color bands
  let strokeColor = '#ef4444'; // Red < 4
  let bgColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60';
  let verdict = 'Needs Focus & Re-Reading';

  if (score >= 7) {
    strokeColor = '#10b981'; // Green 7-10
    bgColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    verdict = 'Outstanding Comprehension & Synthesis';
  } else if (score >= 4) {
    strokeColor = '#f59e0b'; // Amber 4-6
    bgColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60';
    verdict = 'Good Understanding with Minor Conceptual Gaps';
  }

  // SVG parameters
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(10, Math.max(0, animatedScore)) / 10;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox="0 0 160 160"
          aria-hidden="true"
        >
          {/* Background circle track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Animated score circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={strokeColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-extrabold text-4xl sm:text-5xl tracking-tight text-slate-900 dark:text-white font-mono leading-none">
            {Math.round(animatedScore)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
            out of 10
          </span>
        </div>
      </div>

      {/* One-line verdict badge */}
      <div
        className={`mt-4 inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold border ${bgColor}`}
        role="status"
      >
        <span>{verdict}</span>
      </div>
    </div>
  );
}
