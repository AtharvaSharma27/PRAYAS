'use client';

import { useState, useEffect } from 'react';
import { revealArticle, ApiError } from '@/lib/api';
import { RevealArticleResponse } from '@/lib/types';
import { X, BookOpen, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface RevealDrawerProps {
  isOpen: boolean;
  attemptId: string | null;
  missedKeyPoints: string[];
  onClose: () => void;
}

export function RevealDrawer({
  isOpen,
  attemptId,
  missedKeyPoints,
  onClose,
}: RevealDrawerProps) {
  const [data, setData] = useState<RevealArticleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !attemptId) return;

    let isMounted = true;
    const fetchArticle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await revealArticle(attemptId);
        if (isMounted) setData(res);
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof ApiError ? err.message : 'Unable to reveal original article.'
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchArticle();

    return () => {
      isMounted = false;
    };
  }, [isOpen, attemptId]);

  // ESC handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render text with highlight marks
  const renderHighlightedContent = (text: string, highlights: string[] = []) => {
    if (!highlights || highlights.length === 0) {
      return <p className="leading-relaxed">{text}</p>;
    }

    // Sort highlights by length descending to match longer phrases first
    const cleanHighlights = highlights
      .map((h) => h.trim())
      .filter((h) => h.length > 5)
      .sort((a, b) => b.length - a.length);

    if (cleanHighlights.length === 0) {
      return <p className="leading-relaxed">{text}</p>;
    }

    // Escape regex characters
    const escaped = cleanHighlights.map((h) =>
      h.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    );
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <p className="leading-relaxed whitespace-pre-wrap">
        {parts.map((part, index) => {
          const isMatch = cleanHighlights.some(
            (h) => h.toLowerCase() === part.toLowerCase()
          );
          if (isMatch) {
            return (
              <mark
                key={index}
                className="bg-amber-200 dark:bg-amber-900/60 text-slate-900 dark:text-amber-100 px-1 py-0.5 rounded font-semibold transition-colors"
                title="Key missed idea highlighted in context"
              >
                {part}
              </mark>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </p>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="reveal-drawer-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                Article Review & Missed Concepts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare original text side-by-side with your feedback
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close article review drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area: 2 columns on desktop (Article & Missed Points) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Retrieving original article and highlighting missed concepts…
              </p>
            </div>
          )}

          {error && (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                {error}
              </p>
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Full article with highlighted snippets */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Source Text
                  </h3>
                  <span className="text-xs text-slate-400">
                    Highlighted sections represent key ideas
                  </span>
                </div>

                <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {data.article.title}
                </h4>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-sm sm:text-base text-slate-800 dark:text-slate-200">
                  {renderHighlightedContent(data.article.text, data.highlights)}
                </div>
              </div>

              {/* Right Column: Missed Key Points */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Missed Key Points
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {missedKeyPoints.length} noted
                  </span>
                </div>

                {missedKeyPoints.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      Exceptional coverage!
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                      You did not miss any essential structural points from this text.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {missedKeyPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Active Encoding Advice</span>
                  </div>
                  Re-read the highlighted sentences and ask yourself: <em>&ldquo;What problem does this mechanism solve?&rdquo;</em> This helps cement deeper structural memory.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}
