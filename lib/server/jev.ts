/**
 * lib/server/jev.ts
 * JEV (Justified Evaluation via rubrics) Scoring Engine
 *
 * The JEV model operates on three canonical decision types:
 *   • null   — input validation gate; skips scoring for degenerate inputs
 *   • choice — binary yes/no decisions about specific comprehension criteria
 *   • score  — numeric (1-10) ratings derived from choices + statistical metrics
 *
 * This module is fully synchronous, runs locally with zero API calls, and serves
 * as both a fast standalone evaluator (fallback) and a validation baseline for
 * the hybrid LLM + JEV pipeline.
 */

// ── Decision types ────────────────────────────────────────────────────────────

export interface JevNullDecision {
  type: 'null';
  reason: string;
}

export interface JevChoiceDecision {
  type: 'choice';
  question: string;
  answer: boolean;
  confidence: number; // 0–1
}

export interface JevScoreDecision {
  type: 'score';
  dimension: 'mainIdea' | 'keyDetails' | 'ownWords';
  value: number; // 1–10
  reasoning: string;
}

export type JevDecision = JevNullDecision | JevChoiceDecision | JevScoreDecision;

export interface JevResult {
  decisions: JevDecision[];
  scores: {
    mainIdea: number;
    keyDetails: number;
    ownWords: number;
    finalScore: number;
  };
  keyPointsCovered: string[];
  keyPointsMissed: string[];
}

export interface AntiCheatMetrics {
  tabSwitches: number;
  pastedChars: number;
  writingSeconds: number;
}

// ── Text processing utilities ─────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','it','its','was','are','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should',
  'may','might','shall','can','that','this','these','those','which',
  'when','where','who','what','how','why','there','their','they','then',
  'than','so','if','as','up','out','about','into','through','during',
  'each','other','some','such','no','not','only','own','same','also',
  'very','just','because','while','although','however','therefore','used',
  'more','most','over','after','before','between','without','since',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function getTopKeywords(text: string, topN = 14): string[] {
  const tokens = tokenize(text);
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

function overlapRatio(setA: string[], setB: string[]): number {
  if (setA.length === 0) return 0;
  const bSet = new Set(setB);
  const hits = setA.filter(w => bSet.has(w)).length;
  return hits / setA.length;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

function sentenceOverlap(sentence: string, summaryTokens: string[]): number {
  const sentTokens = tokenize(sentence);
  if (sentTokens.length === 0) return 0;
  const summarySet = new Set(summaryTokens);
  return sentTokens.filter(t => summarySet.has(t)).length / sentTokens.length;
}

function truncate(s: string, max = 110): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// ── Main JEV evaluator ────────────────────────────────────────────────────────

export function evaluateWithJev(
  articleText: string,
  summaryText: string,
  metrics: AntiCheatMetrics
): JevResult {
  const decisions: JevDecision[] = [];
  const summaryWords = summaryText.trim().split(/\s+/).filter(Boolean);
  const summaryWordCount = summaryWords.length;

  // ── Phase 1 · Null check ──────────────────────────────────────────────────
  if (summaryWordCount < 20) {
    decisions.push({ type: 'null', reason: 'Summary too short for evaluation (< 20 words)' });
    return {
      decisions,
      scores: { mainIdea: 1, keyDetails: 1, ownWords: 1, finalScore: 1 },
      keyPointsCovered: [],
      keyPointsMissed: [],
    };
  }

  // ── Phase 2 · Choice decisions ────────────────────────────────────────────
  const articleKeywords = getTopKeywords(articleText, 14);
  const summaryTokens = tokenize(summaryText);
  const kwOverlap = overlapRatio(articleKeywords, summaryTokens);

  // Choice A: core domain keywords present?
  const hasKeywords = kwOverlap >= 0.25;
  decisions.push({
    type: 'choice',
    question: 'Does the summary contain core domain keywords from the article?',
    answer: hasKeywords,
    confidence: Math.min(1, kwOverlap / 0.5),
  });

  // Choice B: appropriate length?
  const hasGoodLength = summaryWordCount >= 30 && summaryWordCount <= 150;
  decisions.push({
    type: 'choice',
    question: 'Is the summary within an appropriate length range (30–150 words)?',
    answer: hasGoodLength,
    confidence: hasGoodLength ? 0.9 : 0.4,
  });

  // Choice C: multiple aspects of the article referenced?
  const sentences = splitSentences(articleText);
  const coveredSentences = sentences.filter(s => sentenceOverlap(s, summaryTokens) >= 0.25);
  const missedSentences  = sentences.filter(s => sentenceOverlap(s, summaryTokens) < 0.15);
  const coverageRatio = sentences.length > 0 ? coveredSentences.length / sentences.length : 0;
  const hasMultipleAspects = coverageRatio >= 0.2;
  decisions.push({
    type: 'choice',
    question: 'Does the summary reference multiple aspects or points from the article?',
    answer: hasMultipleAspects,
    confidence: Math.min(1, coverageRatio / 0.4),
  });

  // Choice D: likely written in own words (low paste ratio)?
  const totalSummaryChars = summaryText.length;
  const pasteRatio = totalSummaryChars > 0 ? metrics.pastedChars / totalSummaryChars : 0;
  const isOwnWords = pasteRatio < 0.4;
  decisions.push({
    type: 'choice',
    question: "Is the summary likely written in the student's own words?",
    answer: isOwnWords,
    confidence: Math.min(1, Math.max(0, 1 - pasteRatio)),
  });

  // ── Phase 3 · Score decisions ─────────────────────────────────────────────

  // Main Idea (keyword signal 60% + length 20% + breadth 20%)
  const mainIdeaRaw =
    kwOverlap * 0.6 +
    (hasGoodLength ? 0.2 : 0.05) +
    (hasMultipleAspects ? 0.2 : 0.05);
  const mainIdea = clamp(Math.round(mainIdeaRaw * 10), 1, 10);

  decisions.push({
    type: 'score',
    dimension: 'mainIdea',
    value: mainIdea,
    reasoning: `Keyword overlap: ${pct(kwOverlap)}, coverage ratio: ${pct(coverageRatio)}`,
  });

  // Key Details (coverage × integrity factor penalised by tab switches)
  const integrityFactor = Math.max(0.6, 1 - metrics.tabSwitches * 0.05);
  const keyDetailsRaw = coverageRatio * integrityFactor;
  const keyDetails = clamp(Math.round(keyDetailsRaw * 12), 1, 10);

  decisions.push({
    type: 'score',
    dimension: 'keyDetails',
    value: keyDetails,
    reasoning: `Coverage: ${pct(coverageRatio)}, integrity factor: ${integrityFactor.toFixed(2)} (tab switches: ${metrics.tabSwitches})`,
  });

  // Own Words (paste ratio penalty)
  const ownWordsRaw = Math.max(0, 1 - pasteRatio * 4);
  const ownWords = clamp(Math.round(ownWordsRaw * 9) + 1, 1, 10);

  decisions.push({
    type: 'score',
    dimension: 'ownWords',
    value: ownWords,
    reasoning: `Paste ratio: ${pct(pasteRatio)}`,
  });

  // Weighted final score
  const finalScore = clamp(
    Math.round(mainIdea * 0.4 + keyDetails * 0.35 + ownWords * 0.25),
    1, 10
  );

  return {
    decisions,
    scores: { mainIdea, keyDetails, ownWords, finalScore },
    keyPointsCovered: coveredSentences.slice(0, 4).map(truncate),
    keyPointsMissed:  missedSentences.slice(0, 4).map(truncate),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(0)}%`;
}
