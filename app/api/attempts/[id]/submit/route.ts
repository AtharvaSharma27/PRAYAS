/**
 * POST /api/attempts/[id]/submit
 * Accepts the student's summary, runs hybrid JEV + LLM evaluation,
 * persists the result, and returns the EvaluationResult.
 *
 * Body: SubmitAttemptPayload
 *   { summary, tabSwitches, pastedChars, writingSeconds }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAttempt, updateAttempt, saveToHistory } from '@/lib/server/store';
import { hybridEvaluate } from '@/lib/server/evaluator';
import { countWords } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Request body must be valid JSON with summary.' } },
        { status: 400 }
      );
    }

    const attempt = getAttempt(attemptId);
    if (!attempt) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Attempt not found or expired.' } },
        { status: 404 }
      );
    }

    // Idempotent: return cached result if already evaluated
    if (attempt.result) {
      return NextResponse.json(attempt.result);
    }

    const {
      summary       = '',
      tabSwitches   = 0,
      pastedChars   = 0,
      writingSeconds = 0,
    } = body ?? {};

    if (!summary || typeof summary !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'A summary string is required.' } },
        { status: 400 }
      );
    }

    const wc = countWords(summary);
    if (wc < 20 || wc > 150) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: `Summary must be 20–150 words. Yours is ${wc} words.`,
          },
        },
        { status: 400 }
      );
    }

    // Run evaluation (JEV always; LLM if GEMINI_API_KEY is set)
    const result = await hybridEvaluate({
      articleText:  attempt.articleText,
      summaryText:  summary,
      metrics: {
        tabSwitches:   Number(tabSwitches)   || 0,
        pastedChars:   Number(pastedChars)   || 0,
        writingSeconds: Number(writingSeconds) || 0,
      },
    });

    // Persist and save to history
    updateAttempt(attemptId, { result, submittedAt: Date.now() });
    saveToHistory(attempt, result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[POST /api/attempts/[id]/submit]', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Evaluation failed. Your summary is preserved — please try again.' } },
      { status: 500 }
    );
  }
}
