'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { countWords } from '@/lib/utils';

interface CustomArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, text: string) => void;
  isLoading?: boolean;
}

export function CustomArticleModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CustomArticleModalProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const wordCount = countWords(text);
  const isTooShort = wordCount < 150;
  const isTooLong = wordCount > 600;
  const isValid = !isTooShort && !isTooLong;

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      const cleanTitle = title.trim() || 'Custom Technical Article';
      const cleanText = text.trim();
      onSubmit?.(cleanTitle, cleanText);
      try {
        sessionStorage.setItem(
          'gistcheck_pending_custom',
          JSON.stringify({
            title: cleanTitle,
            text: cleanText,
          })
        );
      } catch (err) {
        console.error('Failed to save custom article to sessionStorage', err);
      }
      window.open('/?custom=true', '_blank');
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="custom-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Paste Your Own Article
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Test your comprehension on custom documentation or research
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 mt-5 gap-4 overflow-y-auto">
          <div>
            <label
              htmlFor="custom-article-title"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Article Title (Optional)
            </label>
            <input
              id="custom-article-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Zero-Knowledge Proofs in Web3"
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="custom-article-text"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Article Content (150–600 words)
              </label>

              {/* Status pill */}
              <div className="flex items-center gap-1.5 text-xs">
                {wordCount === 0 ? (
                  <span className="text-slate-400">0 words</span>
                ) : isTooShort ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{wordCount} / 150 min (needs {150 - wordCount} more)</span>
                  </span>
                ) : isTooLong ? (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{wordCount} words (exceeds 600 max by {wordCount - 600})</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{wordCount} words (valid range)</span>
                  </span>
                )}
              </div>
            </div>

            <textarea
              id="custom-article-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Paste article text here. Must be between 150 and 600 words..."
              required
              className={`w-full flex-1 p-3.5 rounded-xl text-sm border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors resize-none leading-relaxed ${
                wordCount > 0 && !isValid
                  ? 'border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500'
              }`}
            />
          </div>

          {/* Quick paste sample helper for easy testing */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Tip: Ensure the passage introduces a technical concept and mechanism.</span>
            <button
              type="button"
              onClick={() => {
                setTitle('WebAssembly (Wasm) Architecture');
                setText(
                  'WebAssembly is a binary instruction format designed as a portable compilation target for programming languages like C, C++, and Rust, enabling deployment on the web at near-native speed. Unlike traditional JavaScript, which must be downloaded as textual source code, parsed into an Abstract Syntax Tree, and compiled by the browser JIT engine, WebAssembly is delivered in a compact, pre-compiled binary format. The browser executes Wasm modules in a sandboxed, memory-safe execution environment that shares the same security constraints as regular JavaScript. WebAssembly does not replace JavaScript; rather, it complements it by offloading compute-heavy tasks such as video encoding, physics simulation, cryptography, and complex 3D graphic rendering. JavaScript interacts with WebAssembly via bidirectional function calls and linear shared memory. Because Wasm runs with deterministic memory consumption and predictable execution latency, it eliminates unpredictable garbage collection pauses that often degrade performance in large web applications. By bridging system programming languages and the open web platform, WebAssembly expands the frontier of high-performance browser-based computing.'
                );
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Insert sample
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>{isLoading ? 'Starting…' : 'Start Reading'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
