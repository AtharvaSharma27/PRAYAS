/**
 * lib/server/store.ts
 * In-memory data store for GistCheck attempts and history.
 *
 * ⚠️  PRODUCTION NOTE: Replace with a real database (Supabase, PlanetScale,
 * Prisma + PostgreSQL, etc.). In-memory state is lost on server restart and
 * won't work across multiple serverless instances.
 *
 * The global-variable trick below survives Next.js hot-module-replacement
 * in dev mode so your in-progress attempts don't vanish on every save.
 */

import { randomUUID } from 'crypto';
import { EvaluationResult } from '@/lib/types';

export interface StoredAttempt {
  attemptId: string;
  articleId?: string;
  customText?: string;
  customTitle?: string;
  articleTitle: string;
  articleText: string;
  wordCount: number;
  readingSeconds: number;
  createdAt: number;   // Unix ms
  submittedAt?: number;
  result?: EvaluationResult;
}

export interface StoredHistoryEntry {
  attemptId: string;
  articleTitle: string;
  createdAt: string;   // ISO string
  finalScore: number;
  subScores: { mainIdea: number; keyDetails: number; ownWords: number };
  source: string;
}

// ── Global singletons (survive HMR in dev) ───────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __gistcheck_attempts: Map<string, StoredAttempt> | undefined;
  // eslint-disable-next-line no-var
  var __gistcheck_history: StoredHistoryEntry[] | undefined;
}

const attemptStore: Map<string, StoredAttempt> =
  globalThis.__gistcheck_attempts ?? new Map();

const historyStore: StoredHistoryEntry[] =
  globalThis.__gistcheck_history ?? [];

if (process.env.NODE_ENV !== 'production') {
  globalThis.__gistcheck_attempts = attemptStore;
  globalThis.__gistcheck_history = historyStore;
}

// ── CRUD helpers ─────────────────────────────────────────────────────────────

export function createAttempt(
  data: Omit<StoredAttempt, 'attemptId' | 'createdAt'>
): StoredAttempt {
  const attempt: StoredAttempt = {
    ...data,
    attemptId: randomUUID(),
    createdAt: Date.now(),
  };
  attemptStore.set(attempt.attemptId, attempt);
  return attempt;
}

export function getAttempt(attemptId: string): StoredAttempt | undefined {
  return attemptStore.get(attemptId);
}

export function updateAttempt(
  attemptId: string,
  update: Partial<StoredAttempt>
): StoredAttempt | null {
  const existing = attemptStore.get(attemptId);
  if (!existing) return null;
  const updated = { ...existing, ...update };
  attemptStore.set(attemptId, updated);
  return updated;
}

export function saveToHistory(
  attempt: StoredAttempt,
  result: EvaluationResult
): void {
  const entry: StoredHistoryEntry = {
    attemptId: attempt.attemptId,
    articleTitle: attempt.articleTitle,
    createdAt: new Date().toISOString(),
    finalScore: result.finalScore,
    subScores: result.subScores,
    source: result.source,
  };
  historyStore.unshift(entry);
  // Keep only the last 100 entries
  if (historyStore.length > 100) historyStore.length = 100;
}

export function getHistory(): StoredHistoryEntry[] {
  return [...historyStore];
}
