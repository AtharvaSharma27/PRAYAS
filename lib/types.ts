export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ArticleSummary {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  wordCount: number;
}

export interface SeedArticle extends ArticleSummary {
  text: string;
}

export type StartAttemptPayload =
  | { articleId: string; customText?: never; customTitle?: never }
  | { customText: string; customTitle?: string; articleId?: never };

export interface StartAttemptResponse {
  attemptId: string;
  article: {
    title: string;
    text: string;
    wordCount: number;
  };
  readingSeconds: number;
}

export interface SubmitAttemptPayload {
  summary: string;
  tabSwitches: number;
  pastedChars: number;
  writingSeconds: number;
}

export interface EvaluationResult {
  finalScore: number; // 1-10, integer
  subScores: {
    mainIdea: number;
    keyDetails: number;
    ownWords: number;
  }; // 1-10
  keyPointsCovered: string[];
  keyPointsMissed: string[];
  feedback: string;
  tip: string;
  source: 'hybrid' | 'llm-only' | 'jev-only';
  needsReview: boolean;
  latencyMs: number;
}

export type ApiErrorCode =
  | 'RATE_LIMITED'
  | 'INVALID_INPUT'
  | 'READING_NOT_COMPLETED'
  | 'SERVER_ERROR';

export interface ApiErrorDetail {
  code: ApiErrorCode;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface RevealArticleResponse {
  article: {
    title: string;
    text: string;
  };
  highlights?: string[];
}

export interface HistoryAttempt {
  attemptId: string;
  articleTitle: string;
  createdAt: string;
  finalScore: number;
  subScores: {
    mainIdea: number;
    keyDetails: number;
    ownWords: number;
  };
  source: string;
}

export interface HistoryResponse {
  attempts: HistoryAttempt[];
}

export type FlowStage = 'select' | 'reading' | 'writing' | 'result';
