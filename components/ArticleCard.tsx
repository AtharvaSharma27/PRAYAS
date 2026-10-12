'use client';

import { ArticleSummary, Difficulty } from '@/lib/types';
import { Clock, FileText, ArrowRight } from 'lucide-react';

interface ArticleCardProps {
  article: ArticleSummary;
}

const difficultyStyles: Record<
  Difficulty,
  { label: string; bg: string; text: string; border: string }
> = {
  easy: {
    label: 'Easy',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  hard: {
    label: 'Hard',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
};

export function ArticleCard({ article }: ArticleCardProps) {
  const diff = difficultyStyles[article.difficulty] || difficultyStyles.medium;
  const estimatedSeconds = Math.max(30, Math.round((article.wordCount / 200) * 60));
  const estimatedMin = (estimatedSeconds / 60).toFixed(1);

  return (
    <article
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200"
    >
      <div>
        {/* Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
            {article.topic}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${diff.bg} ${diff.text} ${diff.border}`}
          >
            {diff.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 dark:text-white text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {article.title}
        </h3>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1" title={`${article.wordCount} words`}>
            <FileText className="w-3.5 h-3.5" />
            <span>{article.wordCount}w</span>
          </span>
          <span className="inline-flex items-center gap-1" title={`~${estimatedSeconds}s reading duration`}>
            <Clock className="w-3.5 h-3.5" />
            <span>~{estimatedMin} min</span>
          </span>
        </div>

        <a
          href={`/?articleId=${encodeURIComponent(article.id)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-indigo-600 hover:text-white transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={`Start reading ${article.title} in a new tab`}
        >
          <span>Start</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </article>
  );
}
