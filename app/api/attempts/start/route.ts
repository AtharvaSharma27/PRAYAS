/**
 * POST /api/attempts/start
 * Creates a new attempt, returns article content + reading window duration.
 *
 * Body (one of):
 *   { articleId: string }
 *   { customText: string, customTitle?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAttempt } from '@/lib/server/store';
import { countWords } from '@/lib/utils';
import seedArticles from '@/data/seed-articles.json';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Request body must be valid JSON with articleId or customText.' } },
        { status: 400 }
      );
    }

    let articleId: string | undefined;
    let articleTitle: string;
    let articleText: string;
    let wordCount: number;
    let customText: string | undefined;
    let customTitle: string | undefined;

    if (body.articleId) {
      // ── Seeded article ─────────────────────────────────────────────────────
      const found = seedArticles.find(a => a.id === body.articleId);
      if (!found) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: 'Article not found.' } },
          { status: 404 }
        );
      }
      articleId    = found.id;
      articleTitle = found.title;
      articleText  = found.text;
      wordCount    = found.wordCount;

    } else if (body.customText) {
      // ── Custom article ─────────────────────────────────────────────────────
      const wc = countWords(body.customText as string);
      if (wc < 50 || wc > 750) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_INPUT',
              message: `Custom text must be between 50 and 750 words. You provided ${wc} words.`,
            },
          },
          { status: 400 }
        );
      }
      customText   = body.customText as string;
      customTitle  = (body.customTitle as string | undefined) || 'Custom Technical Article';
      articleTitle = customTitle;
      articleText  = customText;
      wordCount    = wc;

    } else {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Provide either articleId or customText.' } },
        { status: 400 }
      );
    }

    // Reading window: 30 s min · 180 s max · proportional to word count at 200 wpm
    const readingSeconds = Math.max(30, Math.min(180, Math.round((wordCount / 200) * 60)));

    const attempt = createAttempt({
      articleId,
      customText,
      customTitle,
      articleTitle,
      articleText,
      wordCount,
      readingSeconds,
    });

    // Shape must match StartAttemptResponse in lib/types.ts
    return NextResponse.json({
      attemptId: attempt.attemptId,
      article: {
        title: attempt.articleTitle,
        text:  attempt.articleText,
        wordCount: attempt.wordCount,
      },
      readingSeconds: attempt.readingSeconds,
    });

  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to start attempt. Please try again.' } },
      { status: 500 }
    );
  }
}
