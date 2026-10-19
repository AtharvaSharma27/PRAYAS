/**
 * lib/server/evaluator.ts
 * Hybrid Evaluation Orchestrator
 *
 * Runs JEV (fast, local, deterministic) and Gemini LLM in parallel.
 * Combines results with a weighted blend:
 *   • Hybrid mode  : LLM scores × 0.65  +  JEV scores × 0.35
 *   • JEV-only     : full JEV result if LLM is unavailable or GEMINI_API_KEY is missing
 *
 * The LLM contributes richer textual feedback and semantic understanding;
 * JEV provides structural validation and an integrity-aware baseline.
 */

import { EvaluationResult } from '@/lib/types';
import { evaluateWithJev, AntiCheatMetrics } from './jev';
import { evaluateWithLLM } from './llm';

export interface EvaluationInput {
  articleText: string;
  summaryText: string;
  metrics: AntiCheatMetrics;
}

// ── Tier-based JEV-only fallback text ─────────────────────────────────────────

function jevFallbackText(finalScore: number): { feedback: string; tip: string } {
  if (finalScore >= 8) {
    return {
      feedback:
        'Your summary demonstrates excellent comprehension of the core concepts and supporting details. ' +
        'You identified the key mechanisms and explained them clearly.',
      tip: 'To push further, try connecting the concepts to real-world systems or trade-offs you have encountered before.',
    };
  }
  if (finalScore >= 5) {
    return {
      feedback:
        'Your summary captures the main theme, but some important technical details are missing or underexplained. ' +
        'Expanding on the mechanisms would strengthen it.',
      tip: 'As you read, mentally outline the 3 most important mechanisms or steps; start your summary by stating those first.',
    };
  }
  return {
    feedback:
      'Your summary needs more focus on the core concepts. ' +
      'Try to identify the single most important idea and build outward from there.',
    tip: 'Before writing, ask yourself: "What problem does this article solve, and what is the key mechanism?" ' +
         'Begin your summary with your answer to that question.',
  };
}

// ── Main hybrid evaluator ─────────────────────────────────────────────────────

export async function hybridEvaluate(input: EvaluationInput): Promise<EvaluationResult> {
  const { articleText, summaryText, metrics } = input;
  const startMs = Date.now();

  // JEV always runs (synchronous, instant)
  const jevResult = evaluateWithJev(articleText, summaryText, metrics);

  // Determine base anti-cheat flag from JEV
  const pasteRatio = summaryText.length > 0 ? metrics.pastedChars / summaryText.length : 0;
  const jevFlaggedReview = pasteRatio > 0.4 || metrics.tabSwitches >= 5;

  // Initialise with JEV-only values (used as fallback if LLM fails)
  let source: EvaluationResult['source'] = 'jev-only';
  let finalMainIdea   = jevResult.scores.mainIdea;
  let finalKeyDetails = jevResult.scores.keyDetails;
  let finalOwnWords   = jevResult.scores.ownWords;
  let keyPointsCovered = jevResult.keyPointsCovered;
  let keyPointsMissed  = jevResult.keyPointsMissed;
  let needsReview = jevFlaggedReview;

  const { feedback: jevFeedback, tip: jevTip } = jevFallbackText(jevResult.scores.finalScore);
  let feedback = jevFeedback;
  let tip = jevTip;

  // Attempt LLM evaluation (may throw if API key missing or network failure)
  try {
    const llmResult = await evaluateWithLLM(articleText, summaryText, metrics);

    // Weighted blend: 65% LLM + 35% JEV for numeric scores
    finalMainIdea   = clamp(Math.round(llmResult.mainIdea   * 0.65 + jevResult.scores.mainIdea   * 0.35), 1, 10);
    finalKeyDetails = clamp(Math.round(llmResult.keyDetails * 0.65 + jevResult.scores.keyDetails * 0.35), 1, 10);
    finalOwnWords   = clamp(Math.round(llmResult.ownWords   * 0.65 + jevResult.scores.ownWords   * 0.35), 1, 10);

    // Prefer LLM's richer textual content; fall back to JEV arrays if LLM returns empty
    keyPointsCovered = llmResult.keyPointsCovered.length > 0 ? llmResult.keyPointsCovered : jevResult.keyPointsCovered;
    keyPointsMissed  = llmResult.keyPointsMissed.length  > 0 ? llmResult.keyPointsMissed  : jevResult.keyPointsMissed;
    feedback = llmResult.feedback;
    tip = llmResult.tip;

    // Either source can independently flag for review
    needsReview = llmResult.needsReview || jevFlaggedReview;
    source = 'hybrid';
  } catch (llmError) {
    // Graceful degradation — JEV-only result is still meaningful
    console.warn('[Evaluator] LLM evaluation failed; falling back to JEV-only:', llmError);
    source = 'jev-only';
  }

  // Weighted final score from the (blended) sub-scores
  const finalScore = clamp(
    Math.round(finalMainIdea * 0.4 + finalKeyDetails * 0.35 + finalOwnWords * 0.25),
    1, 10
  );

  return {
    finalScore,
    subScores: {
      mainIdea:   finalMainIdea,
      keyDetails: finalKeyDetails,
      ownWords:   finalOwnWords,
    },
    keyPointsCovered,
    keyPointsMissed,
    feedback,
    tip,
    source,
    needsReview,
    latencyMs: Date.now() - startMs,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
