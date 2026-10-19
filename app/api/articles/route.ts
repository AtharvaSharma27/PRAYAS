/**
 * GET /api/articles
 * Returns the list of available articles (without full text).
 */
import { NextResponse } from 'next/server';
import seedArticles from '@/data/seed-articles.json';

export function GET() {
  const summaries = seedArticles.map(({ id, title, topic, difficulty, wordCount }) => ({
    id,
    title,
    topic,
    difficulty,
    wordCount,
  }));
  return NextResponse.json(summaries);
}
