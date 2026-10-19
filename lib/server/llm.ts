/**
 * lib/server/llm.ts
 * Google Gemini LLM Evaluation Module
 *
 * Uses Gemini's JSON-mode (structured output) to semantically evaluate student
 * summaries beyond what keyword/sentence overlap can capture. Provides richer
 * feedback, conceptual-depth assessment, and coherent natural-language insights.
 *
 * Model: gemini-2.0-flash  (fast, cheap, supports responseSchema)
 * Requires env var: GEMINI_API_KEY
 */

import dns from 'node:dns';
// Avoid IPv6 resolution delays on platforms where IPv6 routing is impaired
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore in environments where not supported
}

import {
  GoogleGenerativeAI,
  SchemaType,
} from '@google/generative-ai';
import type { AntiCheatMetrics } from './jev';

export interface LLMEvaluationResult {
  mainIdea: number;         // 1–10
  keyDetails: number;       // 1–10
  ownWords: number;         // 1–10
  keyPointsCovered: string[];
  keyPointsMissed: string[];
  feedback: string;
  tip: string;
  needsReview: boolean;
}

// ── Structured output schema ──────────────────────────────────────────────────
// Gemini will strictly produce JSON matching this shape — no regex needed.

const EVALUATION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    mainIdea: {
      type: SchemaType.INTEGER,
      description: 'Integer score 1–10 for main-idea comprehension',
    },
    keyDetails: {
      type: SchemaType.INTEGER,
      description: 'Integer score 1–10 for key-details coverage',
    },
    ownWords: {
      type: SchemaType.INTEGER,
      description: 'Integer score 1–10 for own-words originality',
    },
    keyPointsCovered: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '2–5 specific, concise points the student captured well',
    },
    keyPointsMissed: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '2–5 specific, concise points the student missed or misunderstood',
    },
    feedback: {
      type: SchemaType.STRING,
      description: '2–3 sentence narrative addressed directly to the student',
    },
    tip: {
      type: SchemaType.STRING,
      description: 'One specific, actionable improvement technique for next time',
    },
    needsReview: {
      type: SchemaType.BOOLEAN,
      description: 'Flag true if there are academic integrity concerns',
    },
  },
  required: [
    'mainIdea','keyDetails','ownWords',
    'keyPointsCovered','keyPointsMissed',
    'feedback','tip','needsReview',
  ],
};

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(
  articleText: string,
  summaryText: string,
  metrics: AntiCheatMetrics
): string {
  const totalChars  = summaryText.length;
  const pastePct    = totalChars > 0 ? ((metrics.pastedChars / totalChars) * 100).toFixed(0) : '0';

  return `\
You are an expert educational assessment engine for GistCheck, a micro-learning platform (SDG 4: Quality Education).

The student read the article below under a strict countdown timer, then wrote their summary FROM MEMORY — the original text was hidden during writing. Evaluate how accurately and deeply they understood and recalled it.

═══ ORIGINAL ARTICLE ═══
${articleText}

═══ STUDENT SUMMARY ═══
${summaryText}

═══ SESSION INTEGRITY METRICS ═══
- Tab switches during session : ${metrics.tabSwitches}  (0 = ideal; high = possible distraction or cheating)
- Characters pasted vs typed  : ${metrics.pastedChars} pasted out of ${totalChars} total (${pastePct}% paste rate)
- Time spent writing          : ${metrics.writingSeconds}s

═══ SCORING RUBRIC ═══

Rate each dimension 1–10 (integers only):

mainIdea (40% of final score)
  10 : Precisely identifies the core concept/mechanism the article addresses
   8 : Correctly identifies the main theme with very minor gaps
   6 : Partially captures the main idea; notable vagueness or gaps
   4 : Misidentifies or significantly misrepresents the core concept
   2 : Fails completely; off-topic or trivially superficial
   (Use intermediate values as needed)

keyDetails (35% of final score)
  10 : Includes specific technical details, mechanisms, trade-offs, and implications
   8 : Covers most key supporting details; only minor omissions
   6 : Some details present but several important ones missing
   4 : Very few details; mostly vague/generic statements
   2 : No meaningful technical content

ownWords (25% of final score)
  10 : Entirely paraphrased; demonstrates genuine internalization through novel expression
   8 : Mostly own words; minor borrowed phrasing
   6 : Mix of own words and source phrasing
   4 : Heavy reliance on the source text's exact wording
   2 : Near-verbatim copying; essentially re-pasted article text

needsReview → true if: paste rate > 40%, OR tab switches ≥ 5, OR summary appears directly copied.

keyPointsCovered / keyPointsMissed
  - Be specific (reference actual article content, not generic phrases like "student understands X")
  - Keep each item ≤ 15 words
  - 2–5 items each

feedback: 2–3 sentences, second-person ("you"/"your"), constructive but honest.
tip: One specific, actionable technique (e.g., "Before writing, mentally list the three main mechanisms in order.").`;
}

// ── Main LLM evaluator ────────────────────────────────────────────────────────

export async function evaluateWithLLM(
  articleText: string,
  summaryText: string,
  metrics: AntiCheatMetrics
): Promise<LLMEvaluationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelName = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: EVALUATION_SCHEMA as any,
      temperature: 0.25,   // Low temperature → consistent, calibrated scores
      maxOutputTokens: 1024,
    },
  });

  const result = await model.generateContent(buildPrompt(articleText, summaryText, metrics));
  const raw: LLMEvaluationResult = JSON.parse(result.response.text());

  // Clamp all numeric scores to [1, 10]
  raw.mainIdea   = clamp(Math.round(raw.mainIdea),   1, 10);
  raw.keyDetails = clamp(Math.round(raw.keyDetails), 1, 10);
  raw.ownWords   = clamp(Math.round(raw.ownWords),   1, 10);

  // Guard against missing arrays
  if (!Array.isArray(raw.keyPointsCovered)) raw.keyPointsCovered = [];
  if (!Array.isArray(raw.keyPointsMissed))  raw.keyPointsMissed  = [];

  return raw;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
