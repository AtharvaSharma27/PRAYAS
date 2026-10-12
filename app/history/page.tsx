'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHistory, ApiError } from '@/lib/api';
import { HistoryAttempt } from '@/lib/types';
import { ScoreChart } from '@/components/ScoreChart';
import { HistoryTable } from '@/components/HistoryTable';
import { ErrorCard } from '@/components/ErrorCard';
import Link from 'next/link';
import { ArrowLeft, History as HistoryIcon, Sparkles } from 'lucide-react';

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<HistoryAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getHistory();
      setAttempts(data.attempts || []);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err);
      } else {
        setError(
          new ApiError('SERVER_ERROR', 'Unable to retrieve attempt history.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getHistory()
      .then((data) => {
        if (isMounted) {
          setAttempts(data.attempts || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof ApiError
              ? err
              : new ApiError('SERVER_ERROR', 'Unable to retrieve attempt history.')
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button & Title */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessment Flow</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <HistoryIcon className="w-4 h-4" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Attempt History & Analytics
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Track your cognitive retention trajectory and sub-score metrics over time.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Attempt</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
          <div className="h-72 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          <div className="h-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        </div>
      )}

      {/* Error View */}
      {error && !isLoading && (
        <div className="py-12">
          <ErrorCard
            error={error}
            onRetry={loadHistory}
            title="Failed to Load History"
          />
        </div>
      )}

      {/* Loaded Content */}
      {!isLoading && !error && (
        <div className="space-y-8">
          <ScoreChart attempts={attempts} />
          <HistoryTable attempts={attempts} />
        </div>
      )}
    </div>
  );
}
