'use client';

import { useState, useEffect } from 'react';
import { EvaluationResult } from '@/lib/types';
import { ScoreRing } from './ScoreRing';
import { SubScoreBar } from './SubScoreBar';
import { RevealDrawer } from './RevealDrawer';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  BookOpen,
  RotateCcw,
  ListPlus,
  Cpu,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface ResultViewProps {
  attemptId: string | null;
  result: EvaluationResult;
  onRetryArticle: () => void;
  onTryAnother: () => void;
}

export function ResultView({
  attemptId,
  result,
  onRetryArticle,
  onTryAnother,
}: ResultViewProps) {
  const [isRevealDrawerOpen, setIsRevealDrawerOpen] = useState(false);

  // Trigger celebration confetti for strong scores
  useEffect(() => {
    if (result.finalScore >= 7) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.65 },
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback
      }
    }
  }, [result.finalScore]);

  // Source badges
  const sourceLabelMap: Record<
    EvaluationResult['source'],
    { label: string; bg: string; text: string }
  > = {
    hybrid: {
      label: 'Hybrid Evaluation (LLM + Jev)',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
      text: 'text-indigo-700 dark:text-indigo-300',
    },
    'llm-only': {
      label: 'LLM-only Rubric Engine',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
      text: 'text-purple-700 dark:text-purple-300',
    },
    'jev-only': {
      label: 'Jev Exact Keyword Engine',
      bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
      text: 'text-sky-700 dark:text-sky-300',
    },
  };

  const sourceBadge = sourceLabelMap[result.source] || sourceLabelMap.hybrid;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner Card: Score Ring & Sub-Scores */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Score Ring */}
          <div className="md:col-span-5 flex justify-center">
            <ScoreRing score={result.finalScore} />
          </div>

          {/* Sub-Score Bars */}
          <div className="md:col-span-7 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Rubric Sub-Scores
            </h3>
            <SubScoreBar
              label="Main Idea"
              score={result.subScores.mainIdea}
              description="Accurately pinpointed the primary thesis and objective."
            />
            <SubScoreBar
              label="Key Details"
              score={result.subScores.keyDetails}
              description="Retained critical architectural components and constraints."
            />
            <SubScoreBar
              label="Own-Words Originality"
              score={result.subScores.ownWords}
              description="Synthesized in independent voice rather than verbatim recall."
            />
          </div>
        </div>
      </div>

      {/* Two Columns: What you captured vs What you missed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Captured */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              What You Captured
            </h3>
          </div>

          {result.keyPointsCovered.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No core concepts fully matched the rubric criteria.
            </p>
          ) : (
            <ul className="space-y-3">
              {result.keyPointsCovered.map((point, i) => (
                <li
                  key={i}
                  className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Missed */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
            <XCircle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              What You Missed
            </h3>
          </div>

          {result.keyPointsMissed.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-center">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Flawless coverage! You captured all essential concepts.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {result.keyPointsMissed.map((point, i) => (
                <li
                  key={i}
                  className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Feedback Paragraph & Tip Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm mb-6 space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Evaluator Assessment
          </h3>
          <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed">
            {result.feedback}
          </p>
        </div>

        {/* Tip Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200 mb-0.5">
              Tip to Improve
            </h4>
            <p className="text-xs sm:text-sm text-indigo-900/90 dark:text-indigo-300 leading-relaxed">
              {result.tip}
            </p>
          </div>
        </div>
      </div>

      {/* Meta Row: Scoring Source Badge, Latency, Flagged notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs mb-8">
        <div className="flex flex-wrap items-center gap-3">
          {/* Source badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium border ${sourceBadge.bg} ${sourceBadge.text}`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{sourceBadge.label}</span>
          </span>

          {/* Latency */}
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Response time: {result.latencyMs} ms</span>
          </span>
        </div>

        {/* Flagged notice */}
        {result.needsReview && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
            title="Marked for secondary educator inspection"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Flagged for review</span>
          </span>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => setIsRevealDrawerOpen(true)}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>Reveal Article & Compare</span>
        </button>

        <button
          onClick={onRetryArticle}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry This Article</span>
        </button>

        <button
          onClick={onTryAnother}
          type="button"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ListPlus className="w-4 h-4" />
          <span>Try Another Article</span>
        </button>
      </div>

      {/* Reveal Side Drawer */}
      <RevealDrawer
        isOpen={isRevealDrawerOpen}
        attemptId={attemptId}
        missedKeyPoints={result.keyPointsMissed}
        onClose={() => setIsRevealDrawerOpen(false)}
      />
    </div>
  );
}
