'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArticleSummary, StartAttemptPayload } from '@/lib/types';
import { listArticles, ApiError } from '@/lib/api';
import { ArticleCard } from './ArticleCard';
import { CustomArticleModal } from './CustomArticleModal';
import { ErrorCard } from './ErrorCard';
import { Plus, Search, Sparkles, Filter } from 'lucide-react';

interface ArticleGridProps {
  onStartAttempt: (payload: StartAttemptPayload) => Promise<unknown>;
}

export function ArticleGrid({ onStartAttempt }: ArticleGridProps) {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listArticles();
      setArticles(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err);
      } else {
        setError(
          new ApiError('SERVER_ERROR', 'Unable to retrieve available articles.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    listArticles()
      .then((data) => {
        if (isMounted) {
          setArticles(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof ApiError
              ? err
              : new ApiError('SERVER_ERROR', 'Unable to retrieve available articles.')
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCustomArticleSubmit = async (title: string, text: string) => {
    setIsModalOpen(false);
    await onStartAttempt?.({ customText: text, customTitle: title });
  };

  const topics = ['All', ...Array.from(new Set(articles.map((a) => a.topic)))];

  const filteredArticles = articles.filter((a) => {
    const matchesTopic = selectedTopic === 'All' || a.topic === selectedTopic;
    const matchesQuery =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesQuery;
  });

  if (error) {
    return (
      <div className="py-12">
        <ErrorCard
          error={error}
          onRetry={loadArticles}
          title="Could Not Load Articles"
        />
      </div>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Intro hero banner */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Active Recall & Micro-Comprehension</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Test Your Comprehension Under Time
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Select a technical text below or paste your own. Read within the countdown window,
          synthesize the core gist in your own words once hidden, and receive instant rubric feedback.
        </p>
      </div>

      {/* Controls: Search and Topic Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles or topics…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm"
          />
        </div>

        {/* Topics */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden md:block" />
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedTopic === topic
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* "Paste your own" action card */}
        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="group relative flex flex-col items-center justify-center min-h-[220px] p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white/50 dark:bg-slate-900/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Paste custom article"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Paste Your Own Article
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
            150–600 words of technical text, research, or documentation
          </p>
        </button>

        {/* Loading Skeletons */}
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="flex justify-between mb-3">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}

        {/* Loaded Articles */}
        {!isLoading &&
          filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
            />
          ))}
      </div>

      {/* Empty State */}
      {!isLoading && filteredArticles.length === 0 && (
        <div className="text-center py-16 px-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            No articles match your search criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTopic('All');
            }}
            className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Custom Article Modal */}
      <CustomArticleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCustomArticleSubmit}
      />
    </section>
  );
}
