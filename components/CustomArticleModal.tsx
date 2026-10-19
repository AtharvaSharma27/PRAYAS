'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Upload,
  FileText,
  Loader2,
  FileCheck,
  Info,
} from 'lucide-react';
import { countWords } from '@/lib/utils';

interface CustomArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, text: string) => void;
  isLoading?: boolean;
}

type TabMode = 'pdf' | 'paste';

export function CustomArticleModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CustomArticleModalProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('pdf');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  // PDF upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [pdfMeta, setPdfMeta] = useState<{
    fileName: string;
    pageCount: number;
    wordCount: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(text);
  const minWords = activeTab === 'pdf' ? 50 : 150;
  const maxWords = activeTab === 'pdf' ? 750 : 600;
  const isTooShort = wordCount < minWords;
  const isTooLong = wordCount > maxWords;
  const isValid = activeTab === 'pdf'
    ? Boolean(pdfMeta && !isTooShort && !isTooLong)
    : (!isTooShort && !isTooLong);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset states when closed
  useEffect(() => {
    if (!isOpen) {
      setUploadError(null);
      setUploadWarning(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePdfUpload = async (file: File) => {
    setUploadError(null);
    setUploadWarning(null);

    // Client-side quick checks
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Only PDF files (.pdf) are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`File is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pdf/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setUploadError(data?.error?.message || 'Failed to extract text from PDF.');
        setIsUploading(false);
        return;
      }

      setTitle(data.title || file.name.replace(/\.[^/.]+$/, ''));
      setText(data.text || '');
      setPdfMeta({
        fileName: data.fileName,
        pageCount: data.pageCount,
        wordCount: data.wordCount,
      });

      if (data.warning) {
        setUploadWarning(data.warning);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network failure while processing PDF.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePdfUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePdfUpload(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      const cleanTitle = title.trim() || 'Custom Technical Article';
      const cleanText = text.trim();
      onSubmit?.(cleanTitle, cleanText);
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
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-7 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="custom-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Custom Technical Reading
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your research paper PDF or paste documentation (150–600 words)
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pdf'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'paste'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Text Directly</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 mt-4 gap-4 overflow-y-auto pr-1">
          {/* TAB 1: PDF Upload Mode */}
          {activeTab === 'pdf' && (
            <div className="flex flex-col gap-3">
              {/* PDF Restrictions Notice */}
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-300">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>PDF Guidelines for Micro-Learning Recall:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mt-1.5">
                  <span className="bg-white/80 dark:bg-indigo-900/40 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800">
                    📄 <strong>Max 2 Pages</strong>
                  </span>
                  <span className="bg-white/80 dark:bg-indigo-900/40 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800">
                    📝 <strong>150–600 Words</strong>
                  </span>
                  <span className="bg-white/80 dark:bg-indigo-900/40 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800">
                    📦 <strong>Max 5 MB</strong>
                  </span>
                  <span className="bg-white/80 dark:bg-indigo-900/40 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800">
                    🔍 <strong>Selectable Text</strong>
                  </span>
                </div>
              </div>

              {/* Upload Dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Dropzone or Loaded Confirmation Card */}
              {isUploading ? (
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Extracting text & verifying page constraints…
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Analyzing pages and calculating word count
                  </p>
                </div>
              ) : pdfMeta ? (
                <div className="p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {title || pdfMeta.fileName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {pdfMeta.fileName}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 px-2 py-1"
                    >
                      Change PDF
                    </button>
                  </div>

                  {/* Verification stats */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{pdfMeta.pageCount} page(s)</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{pdfMeta.wordCount} words</span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-auto">
                      Estimated reading window: ~{Math.round((pdfMeta.wordCount / 200) * 60)}s
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    PDF text extracted successfully! Click <strong>Start Reading</strong> below to begin the timed comprehension session.
                  </p>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-indigo-50/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drop your PDF here
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm text-center">
                    Upload an academic paper abstract, technical article, or whitepaper excerpt (1–2 pages)
                  </p>
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Warning Banner */}
              {uploadWarning && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadWarning}</span>
                </div>
              )}
            </div>
          )}
          {/* TAB 2: Direct Paste Mode (Title + Textarea) */}
          {activeTab === 'paste' && (
            <>
              {/* Editable Title Input */}
              <div>
                <label
                  htmlFor="custom-article-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
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

              {/* Text Content Editor */}
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
                        <span>{wordCount} words (exceeds 600 by {wordCount - 600})</span>
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

              {/* Sample helper in paste mode */}
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
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isValid || isLoading || isUploading}
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
