import seedArticlesData from '../data/seed-articles.json';
import {
  ArticleSummary,
  SeedArticle,
  StartAttemptPayload,
  StartAttemptResponse,
  SubmitAttemptPayload,
  EvaluationResult,
  RevealArticleResponse,
  HistoryResponse,
  HistoryAttempt,
  ApiErrorCode,
} from './types';

const seedArticles: SeedArticle[] = seedArticlesData as SeedArticle[];

// In-memory cache of attempts for mock mode
interface StoredAttempt {
  attemptId: string;
  articleTitle: string;
  articleText: string;
  wordCount: number;
  readingSeconds: number;
  createdAt: string;
  evaluation?: EvaluationResult;
}

const attemptStore = new Map<string, StoredAttempt>();

// Initialize seed attempts in store
seedArticles.forEach((art) => {
  attemptStore.set(`seed-${art.id}`, {
    attemptId: `seed-${art.id}`,
    articleTitle: art.title,
    articleText: art.text,
    wordCount: art.wordCount,
    readingSeconds: Math.max(35, Math.round((art.wordCount / 220) * 60)),
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  });
});

const HISTORY_STORAGE_KEY = 'gistcheck_mock_history_v1';

function getStoredHistory(): HistoryAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read history from localStorage', e);
  }
  // Default sample history for immediate rich demonstration
  const initialHistory: HistoryAttempt[] = [
    {
      attemptId: 'hist-1',
      articleTitle: 'How DNS Resolves Domain Names',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      finalScore: 8,
      subScores: { mainIdea: 9, keyDetails: 8, ownWords: 8 },
      source: 'hybrid',
    },
    {
      attemptId: 'hist-2',
      articleTitle: 'Understanding Event Loops in JavaScript',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      finalScore: 6,
      subScores: { mainIdea: 7, keyDetails: 6, ownWords: 6 },
      source: 'llm-only',
    },
    {
      attemptId: 'hist-3',
      articleTitle: 'Database Indexing with B-Trees',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      finalScore: 9,
      subScores: { mainIdea: 10, keyDetails: 9, ownWords: 9 },
      source: 'hybrid',
    },
  ];
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(initialHistory));
  } catch {
    // Ignore storage errors
  }
  return initialHistory;
}

function saveAttemptToHistory(attempt: HistoryAttempt) {
  if (typeof window === 'undefined') return;
  try {
    const history = getStoredHistory();
    const updated = [attempt, ...history];
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save attempt to localStorage', e);
  }
}

function randomLatency(min = 800, max = 2000): Promise<number> {
  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(() => resolve(duration), duration));
}

function checkMockErrorParam(): ApiErrorCode | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const mockError = params.get('mockError');
    if (
      mockError &&
      ['RATE_LIMITED', 'INVALID_INPUT', 'READING_NOT_COMPLETED', 'SERVER_ERROR'].includes(
        mockError
      )
    ) {
      return mockError as ApiErrorCode;
    }
  } catch {
    // ignore
  }
  return null;
}

export class MockApiError extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(code: ApiErrorCode, message: string, status = 400) {
    super(message);
    this.name = 'MockApiError';
    this.code = code;
    this.status = status;
  }
}

function checkAndThrowForcedError() {
  const forced = checkMockErrorParam();
  if (forced) {
    switch (forced) {
      case 'RATE_LIMITED':
        throw new MockApiError('RATE_LIMITED', 'Rate limit exceeded. Please wait a moment before trying again.', 429);
      case 'INVALID_INPUT':
        throw new MockApiError('INVALID_INPUT', 'The submitted input did not satisfy length or validation rules.', 400);
      case 'READING_NOT_COMPLETED':
        throw new MockApiError('READING_NOT_COMPLETED', 'Reading session must be completed before writing a summary.', 403);
      case 'SERVER_ERROR':
      default:
        throw new MockApiError('SERVER_ERROR', 'An unexpected error occurred in the evaluation service.', 500);
    }
  }
}

export async function mockListArticles(): Promise<ArticleSummary[]> {
  await randomLatency(500, 1000);
  checkAndThrowForcedError();

  return seedArticles.map((art) => ({
    id: art.id,
    title: art.title,
    topic: art.topic,
    difficulty: art.difficulty,
    wordCount: art.wordCount,
  }));
}

export async function mockStartAttempt(payload: StartAttemptPayload): Promise<StartAttemptResponse> {
  await randomLatency(600, 1200);
  checkAndThrowForcedError();

  let title = 'Custom Reading Material';
  let text = '';
  let wordCount = 0;

  if (payload.articleId) {
    const found = seedArticles.find((a) => a.id === payload.articleId);
    if (!found) {
      throw new MockApiError('INVALID_INPUT', `Article with ID "${payload.articleId}" not found.`, 404);
    }
    title = found.title;
    text = found.text;
    wordCount = found.wordCount;
  } else if (payload.customText) {
    text = payload.customText.trim();
    title = payload.customTitle?.trim() || 'Custom Article';
    const words = text.split(/\s+/).filter(Boolean);
    wordCount = words.length;

    if (wordCount < 150 || wordCount > 600) {
      throw new MockApiError('INVALID_INPUT', 'Custom text must be between 150 and 600 words.', 400);
    }
  } else {
    throw new MockApiError('INVALID_INPUT', 'Either articleId or customText must be provided.', 400);
  }

  const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const readingSeconds = Math.max(30, Math.min(180, Math.round((wordCount / 200) * 60)));

  attemptStore.set(attemptId, {
    attemptId,
    articleTitle: title,
    articleText: text,
    wordCount,
    readingSeconds,
    createdAt: new Date().toISOString(),
  });

  return {
    attemptId,
    article: {
      title,
      text,
      wordCount,
    },
    readingSeconds,
  };
}

export async function mockSubmitAttempt(
  attemptId: string,
  payload: SubmitAttemptPayload
): Promise<EvaluationResult> {
  const start = performance.now();
  await randomLatency(1000, 2000);
  checkAndThrowForcedError();

  const attempt = attemptStore.get(attemptId);
  if (!attempt) {
    throw new MockApiError('INVALID_INPUT', `Attempt session "${attemptId}" not found or expired.`, 404);
  }

  const summary = (payload.summary || '').trim();
  const summaryWords = summary.split(/\s+/).filter(Boolean);
  const wordCount = summaryWords.length;

  if (wordCount < 20 || wordCount > 150) {
    throw new MockApiError('INVALID_INPUT', `Summary must be between 20 and 150 words. Provided: ${wordCount} words.`, 400);
  }

  // Plausible keyword overlap analysis
  const cleanSummary = summary.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const summaryTokens = new Set(cleanSummary.split(/\s+/).filter((w) => w.length > 3));

  // Extract candidate key terms from the article
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'were', 'which', 'their', 'there',
    'been', 'they', 'what', 'when', 'where', 'also', 'more', 'some', 'than',
    'into', 'only', 'other', 'them', 'these', 'would', 'about', 'after'
  ]);
  const cleanArticle = attempt.articleText.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const articleWords = cleanArticle.split(/\s+/).filter((w) => w.length > 3 && !stopWords.has(w));

  const wordFrequencies: Record<string, number> = {};
  articleWords.forEach((w) => {
    wordFrequencies[w] = (wordFrequencies[w] || 0) + 1;
  });

  const sortedKeywords = Object.entries(wordFrequencies)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 10);

  const matchedKeywords = sortedKeywords.filter((kw) => summaryTokens.has(kw));

  // Key points extraction: split article into sentences
  const sentences = attempt.articleText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);

  const keyPointsCovered: string[] = [];
  const keyPointsMissed: string[] = [];

  sentences.slice(0, 5).forEach((sentence) => {
    const sWords = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 3);
    const overlap = sWords.filter((w) => summaryTokens.has(w)).length;
    const ratio = overlap / Math.max(1, sWords.length);

    if (ratio >= 0.25 || matchedKeywords.some((k) => sentence.toLowerCase().includes(k))) {
      keyPointsCovered.push(sentence);
    } else {
      keyPointsMissed.push(sentence);
    }
  });

  if (keyPointsCovered.length === 0 && sentences.length > 0) {
    keyPointsCovered.push(sentences[0]);
  }
  if (keyPointsMissed.length === 0 && sentences.length > 1) {
    keyPointsMissed.push(sentences[sentences.length - 1]);
  }

  // Scoring logic:
  let lengthFactor = 1.0;
  if (wordCount < 30) lengthFactor = 0.7;
  else if (wordCount > 130) lengthFactor = 0.85;

  const keywordRatio = Math.min(1, matchedKeywords.length / Math.max(3, sortedKeywords.length * 0.4));
  const integrityFactor = Math.max(0.7, 1 - payload.tabSwitches * 0.05);

  const mainIdea = Math.min(10, Math.max(1, Math.round((7 + keywordRatio * 3) * lengthFactor)));
  const keyDetails = Math.min(10, Math.max(1, Math.round((5 + (keyPointsCovered.length / Math.max(1, keyPointsCovered.length + keyPointsMissed.length)) * 5) * integrityFactor)));
  
  const pasteRatio = payload.pastedChars / Math.max(1, summary.length);
  const ownWords = Math.min(10, Math.max(1, Math.round(9 - pasteRatio * 5)));

  const calculatedAverage = (mainIdea * 0.4 + keyDetails * 0.35 + ownWords * 0.25);
  const finalScore = Math.min(10, Math.max(1, Math.round(calculatedAverage)));

  // Feedback paragraphs
  let feedback = '';
  let tip = '';
  if (finalScore >= 8) {
    feedback = `Outstanding synthesis! You effectively captured the core objective and structural principles of "${attempt.articleTitle}". Your response synthesized the fundamental mechanisms rather than reciting isolated trivia.`;
    tip = 'To elevate your technical summaries even further, try explicitly connecting the mechanism to its real-world trade-off or architectural constraint.';
  } else if (finalScore >= 5) {
    feedback = `Good overall comprehension of "${attempt.articleTitle}". You accurately conveyed the primary premise, though some critical operational details and supporting criteria were either abbreviated or overlooked.`;
    tip = 'Focus on explaining cause-and-effect relationships (e.g. why a specific mechanism is used) rather than listing facts.';
  } else {
    feedback = `You made a valiant attempt, but the summary does not yet capture the central mechanics of "${attempt.articleTitle}". Key architectural concepts were missing or unclear.`;
    tip = 'Next time, identify the main problem the author introduces in the first two sentences, then note the primary solution they present.';
  }

  const randSource = Math.random();
  const source: 'hybrid' | 'llm-only' | 'jev-only' =
    randSource < 0.6 ? 'hybrid' : randSource < 0.85 ? 'llm-only' : 'jev-only';

  const needsReview = Math.random() < 0.1;

  const result: EvaluationResult = {
    finalScore,
    subScores: {
      mainIdea,
      keyDetails,
      ownWords,
    },
    keyPointsCovered: keyPointsCovered.slice(0, 4),
    keyPointsMissed: keyPointsMissed.slice(0, 4),
    feedback,
    tip,
    source,
    needsReview,
    latencyMs: Math.round(performance.now() - start),
  };

  attempt.evaluation = result;

  saveAttemptToHistory({
    attemptId,
    articleTitle: attempt.articleTitle,
    createdAt: new Date().toISOString(),
    finalScore: result.finalScore,
    subScores: result.subScores,
    source: result.source,
  });

  return result;
}

export async function mockRevealArticle(attemptId: string): Promise<RevealArticleResponse> {
  await randomLatency(500, 1000);
  checkAndThrowForcedError();

  const attempt = attemptStore.get(attemptId);
  if (!attempt) {
    const firstSeed = seedArticles[0];
    return {
      article: {
        title: firstSeed.title,
        text: firstSeed.text,
      },
      highlights: [
        'translating human-friendly hostnames into machine-routable IP addresses',
        'caching at multiple architectural layers',
      ],
    };
  }

  const missedSnippets = attempt.evaluation?.keyPointsMissed?.slice(0, 3) || [];
  const highlights = missedSnippets.length > 0
    ? missedSnippets
    : [attempt.articleText.slice(0, 120)];

  return {
    article: {
      title: attempt.articleTitle,
      text: attempt.articleText,
    },
    highlights,
  };
}

export async function mockGetHistory(): Promise<HistoryResponse> {
  await randomLatency(400, 900);
  checkAndThrowForcedError();

  const attempts = getStoredHistory();
  return { attempts };
}
