'use client';

import { ApiError } from '@/lib/api';
import { AlertCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';

interface ErrorCardProps {
  error: ApiError | Error | null;
  onRetry?: () => void;
  onReset?: () => void;
  title?: string;
}

export function ErrorCard({
  error,
  onRetry,
  onReset,
  title = 'Something went wrong',
}: ErrorCardProps) {
  let friendlyTitle = title;
  let friendlyMessage =
    'We were unable to complete this action due to an unexpected problem. Please try again.';
  let icon = <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />;

  if (error instanceof ApiError) {
    switch (error.code) {
      case 'RATE_LIMITED':
        friendlyTitle = 'Evaluation Rate Limit Reached';
        friendlyMessage =
          'You have conducted several assessments in a short time. Please wait a brief moment before submitting again.';
        icon = <Clock className="w-6 h-6 text-amber-500" />;
        break;
      case 'INVALID_INPUT':
        friendlyTitle = 'Summary Needs Adjustment';
        friendlyMessage =
          error.message ||
          'Please ensure your summary is between 20 and 150 words and provides a substantive synthesis.';
        break;
      case 'READING_NOT_COMPLETED':
        friendlyTitle = 'Reading Session Required';
        friendlyMessage =
          'To test genuine comprehension, each summary attempt must follow a completed reading period.';
        break;
      case 'SERVER_ERROR':
      default:
        friendlyTitle = 'Service Temporarily Unavailable';
        friendlyMessage =
          'The assessment service encountered an unexpected error. Your summary text has been preserved so you can retry safely.';
        break;
    }
  } else if (error?.message) {
    friendlyMessage = error.message;
  }

  return (
    <div
      role="alert"
      className="w-full max-w-xl mx-auto p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-lg shadow-rose-500/5 text-center flex flex-col items-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center mb-4">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {friendlyTitle}
      </h3>

      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 max-w-md">
        {friendlyMessage}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}

        {onReset && (
          <button
            onClick={onReset}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Choose Another Article</span>
          </button>
        )}
      </div>
    </div>
  );
}
