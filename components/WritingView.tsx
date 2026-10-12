'use client';

import { useState, useEffect } from 'react';
import { WordCounter } from './WordCounter';
import { ErrorCard } from './ErrorCard';
import { countWords, formatSeconds } from '@/lib/utils';
import { ApiError } from '@/lib/api';
import {
  Send,
  Clock,
  Sparkles,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

interface WritingViewProps {
  articleTitle: string;
  summary: string;
  onUpdateSummary: (text: string) => void;
  onRecordPaste: (charsCount: number) => void;
  onSubmit: () => Promise<void>;
  isEvaluating: boolean;
  evaluationError: ApiError | null;
  onRetrySubmit: () => void;
  onReset: () => void;
}

const rotatingMessages = [
  'Reading your summary…',
  'Analyzing conceptual depth…',
  'Checking key ideas against the source…',
  'Evaluating own-words originality…',
  'Synthesizing rubric feedback and tips…',
];

export function WritingView({
  articleTitle,
  summary,
  onUpdateSummary,
  onRecordPaste,
  onSubmit,
  isEvaluating,
  evaluationError,
  onRetrySubmit,
  onReset,
}: WritingViewProps) {
  const [softSecondsRemaining, setSoftSecondsRemaining] = useState(180); // 3-minute soft timer
  const [isSoftTimerRunning, setIsSoftTimerRunning] = useState(true);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const wordCount = countWords(summary);
  const isValid = wordCount >= 20 && wordCount <= 150;

  // Soft timer interval
  useEffect(() => {
    if (!isSoftTimerRunning || isEvaluating) return;

    const interval = setInterval(() => {
      setSoftSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isSoftTimerRunning, isEvaluating]);

  // Rotating loading messages
  useEffect(() => {
    if (!isEvaluating) return;

    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % rotatingMessages.length);
    }, 700);

    return () => clearInterval(interval);
  }, [isEvaluating]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.length > 0) {
      onRecordPaste(pastedText.length);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isEvaluating) {
      onSubmit();
    }
  };

  // If evaluation error occurred, show friendly ErrorCard
  if (evaluationError) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-4">
        <ErrorCard
          error={evaluationError}
          onRetry={onRetrySubmit}
          onReset={onReset}
          title="Could Not Complete Assessment"
        />
      </div>
    );
  }

  // If evaluating, show skeleton UI with rotating messages
  if (isEvaluating) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl text-center flex flex-col items-center">
          {/* Animated Spinner & Glow */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-100 dark:border-indigo-950/60 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-all duration-300">
            {rotatingMessages[loadingMsgIdx]}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
            Our multi-criteria evaluation engine is assessing your understanding and generating targeted suggestions.
          </p>

          {/* Result skeleton placeholder preview */}
          <div className="w-full max-w-lg space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-3/4 mx-auto animate-pulse" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {/* Title and prompt header */}
        <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <FileCheck className="w-4 h-4" />
              <span>Article Recall</span>
            </span>

            {/* Optional 3-minute soft timer indicator */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Target Time:{' '}
                <span
                  className={`font-mono font-semibold ${
                    softSecondsRemaining === 0 ? 'text-amber-500' : ''
                  }`}
                >
                  {formatSeconds(softSecondsRemaining)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsSoftTimerRunning(!isSoftTimerRunning)}
                className="text-[11px] underline hover:text-slate-900 dark:hover:text-white"
                title={isSoftTimerRunning ? 'Pause soft timer' : 'Resume soft timer'}
              >
                {isSoftTimerRunning ? 'pause' : 'resume'}
              </button>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {articleTitle}
          </h1>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">
            <strong>Prompt:</strong> In 2–5 sentences, explain the main idea and purpose of what you just read, in your own words.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="summary-textarea"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Your Summary
              </label>

              <WordCounter currentCount={wordCount} min={20} max={150} />
            </div>

            <textarea
              id="summary-textarea"
              value={summary}
              onChange={(e) => onUpdateSummary(e.target.value)}
              onPaste={handlePaste}
              rows={7}
              placeholder="Write your explanation here in your own words... (minimum 20 words, maximum 150 words)"
              className={`w-full p-4 rounded-2xl text-base sm:text-lg border bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all resize-y leading-relaxed ${
                wordCount > 0 && !isValid
                  ? 'border-rose-300 dark:border-rose-700/80 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500'
              }`}
            />
          </div>

          {/* Submission Guidelines & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Originality, synthesis quality, and key idea coverage are analyzed.
              </span>
            </div>

            <button
              type="submit"
              disabled={!isValid || isEvaluating}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0"
              aria-label="Submit summary for evaluation"
            >
              <span>Submit Summary</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
