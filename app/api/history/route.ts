/**
 * GET /api/history
 * Returns all completed attempt history for the current server session.
 *
 * Shape matches HistoryResponse in lib/types.ts:
 *   { attempts: HistoryAttempt[] }
 */
import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/server/store';

export function GET() {
  const attempts = getHistory();
  return NextResponse.json({ attempts });
}
