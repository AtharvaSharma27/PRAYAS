'use client';

import { useState } from 'react';
import { useCountdown } from '@/lib/useCountdown';
import { CountdownBar } from './CountdownBar';
import { Eye, ArrowRight, ShieldAlert, AlertTriangle } from 'lucide-react';

interface ReadingViewProps {
  title: string;
  text: string;
  wordCount: number;
  readingSeconds: number;
  tabSwitches: number;
  onFinishReading: () => void;
}

export function ReadingView({
  title,
  text,
  wordCount,
  readingSeconds,
  tabSwitches,
  onFinishReading,
}: ReadingViewProps) {
  const [copyWarning, setCopyWarning] = useState<string | null>(null);

  const { secondsRemaining, progress } = useCountdown({
    initialSeconds: readingSeconds,
    autoStart: true,
    onFinish: onFinishReading,
  });

  const handleCopyPrevent = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setCopyWarning('Copying is disabled. Active recall requires summarizing in your own words!');
    setTimeout(() => {
      setCopyWarning(null);
    }, 3500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4">
      {/* Toast Alert for Copy Prevention */}
      {copyWarning && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs sm:text-sm font-medium shadow-xl flex items-center gap-2 border border-slate-700/50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 max-w-md text-center"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{copyWarning}</span>
        </div>
      )}

      {/* Tab Switch Focus Warning */}
      {tabSwitches > 0 && !copyWarning && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-amber-950/90 text-amber-100 text-xs sm:text-sm font-medium shadow-xl flex items-center gap-2 border border-amber-800 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 max-w-md text-center"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Focus warning: Tab switch detected ({tabSwitches}). Stay on this page for retention!</span>
        </div>
      )}

      {/* ARIA Live Region for screen readers */}
      <div className="sr-only" aria-live="polite">
        {secondsRemaining === 15 && 'Warning: 15 seconds remaining to complete reading.'}
        {secondsRemaining === 0 && 'Reading time expired. Transitioning to writing.'}
      </div>

      {/* Sticky Header with Timer & Early Finish Button */}
      <div className="sticky top-20 z-30 mb-8 p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <CountdownBar
            secondsRemaining={secondsRemaining}
            totalSeconds={readingSeconds}
            progress={progress}
            isAmberThreshold={secondsRemaining <= 15}
          />
        </div>

        <div className="flex items-center gap-3 justify-end shrink-0">
          <button
            onClick={onFinishReading}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="I am done reading early"
          >
            <span>I’m done reading</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Banner */}
      <div className="mb-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Active recall mode:</strong> Focus on the gist. The text will disappear once the timer runs out!
          </span>
        </div>
        <span className="hidden sm:inline-block text-xs font-mono text-amber-600 dark:text-amber-400 shrink-0">
          {wordCount} words
        </span>
      </div>

      {/* Comfortable Reading Article Container */}
      <article
        onCopy={handleCopyPrevent}
        onCut={handleCopyPrevent}
        onContextMenu={handleCopyPrevent}
        className="unselectable-reading p-6 sm:p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all select-none"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
          <Eye className="w-4 h-4" />
          <span>Reading Material</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
          {title}
        </h1>

        <div className="prose prose-slate dark:prose-invert max-w-prose mx-auto text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-normal space-y-4">
          <p className="leading-8 text-justify select-none">{text}</p>
        </div>
      </article>

      {/* Bottom Completion Action */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onFinishReading}
          type="button"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          aria-label="I am done reading - proceed to writing"
        >
          <span>I’m done reading</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Sub-note on copy deterrents */}
      <div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Copying, cutting, and text selection are restricted to encourage active cognitive encoding.
      </div>
    </div>
  );
}
