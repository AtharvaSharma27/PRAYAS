/**
 * GET /api/attempts/[id]/reveal
 * Returns the full article text and highlight ranges after evaluation.
 * Highlights are sentences from the article that best match each missed key point,
 * giving the student in-context visibility into what they forgot.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAttempt } from '@/lib/server/store';

/**
 * For each missed key point, find the sentence in the article with the greatest
 * word-overlap, then return those sentences as highlight strings.
 */
function generateHighlights(articleText: string, missedKeyPoints: string[]): string[] {
  if (!missedKeyPoints.length) return [];

  const sentences = articleText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const highlights: string[] = [];

  for (const point of missedKeyPoints) {
    // Tokenise the missed point (ignore short/stop words)
    const pointWords = point
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    if (!pointWords.length) continue;

    let bestSentence = '';
    let bestScore    = 0;

    for (const sentence of sentences) {
      const sentLower = sentence.toLowerCase();
      const score = pointWords.filter(w => sentLower.includes(w)).length / pointWords.length;
      if (score > bestScore) {
        bestScore    = score;
        bestSentence = sentence;
      }
    }

    // Only include if we found a reasonable match and haven't already added it
    if (bestScore > 0.15 && bestSentence && !highlights.includes(bestSentence)) {
      highlights.push(bestSentence);
    }
  }

  return highlights;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const attempt = getAttempt(attemptId);

    if (!attempt) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Attempt not found or expired.' } },
        { status: 404 }
      );
    }

    if (!attempt.result) {
      return NextResponse.json(
        {
          error: {
            code: 'READING_NOT_COMPLETED',
            message: 'Submit your summary before revealing the article.',
          },
        },
        { status: 403 }
      );
    }

    const highlights = generateHighlights(
      attempt.articleText,
      attempt.result.keyPointsMissed
    );

    // Shape matches RevealArticleResponse in lib/types.ts
    return NextResponse.json({
      article: {
        title: attempt.articleTitle,
        text:  attempt.articleText,
      },
      highlights,
    });

  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to retrieve article.' } },
      { status: 500 }
    );
  }
}
