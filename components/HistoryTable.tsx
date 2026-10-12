'use client';

import { HistoryAttempt } from '@/lib/types';
import Link from 'next/link';
import { Calendar, Award, Cpu, ArrowRight } from 'lucide-react';

interface HistoryTableProps {
  attempts: HistoryAttempt[];
}

export function HistoryTable({ attempts }: HistoryTableProps) {
  if (!attempts || attempts.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          No Attempt History Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
          Complete your first comprehension assessment to begin tracking your active recall retention.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
        >
          <span>Start an Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const getScoreBadge = (score: number) => {
    if (score >= 7) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (score >= 4) {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          All Evaluation Attempts
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing {attempts.length} recorded session{attempts.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Article
              </th>
              <th scope="col" className="px-6 py-3.5">
                Date
              </th>
              <th scope="col" className="px-6 py-3.5 text-center">
                Score
              </th>
              <th scope="col" className="px-6 py-3.5">
                Sub-Scores
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {attempts.map((attempt) => {
              const date = new Date(attempt.createdAt);
              const formattedDate = date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr
                  key={attempt.attemptId}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                    {attempt.articleTitle}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formattedDate}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold border ${getScoreBadge(
                        attempt.finalScore
                      )}`}
                    >
                      {attempt.finalScore}/10
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {attempt.subScores ? (
                      <span className="font-mono">
                        Main: {attempt.subScores.mainIdea} · Details:{' '}
                        {attempt.subScores.keyDetails} · Words:{' '}
                        {attempt.subScores.ownWords}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      <Cpu className="w-3 h-3" />
                      <span>{attempt.source}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {attempts.map((attempt) => {
          const date = new Date(attempt.createdAt);
          const formattedDate = date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

          return (
            <div key={attempt.attemptId} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {attempt.articleTitle}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border shrink-0 ${getScoreBadge(
                    attempt.finalScore
                  )}`}
                >
                  {attempt.finalScore}/10
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </span>
                <span className="capitalize">{attempt.source}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
