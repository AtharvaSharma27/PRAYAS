import {
  ArticleSummary,
  StartAttemptPayload,
  StartAttemptResponse,
  SubmitAttemptPayload,
  EvaluationResult,
  RevealArticleResponse,
  HistoryResponse,
  ApiErrorCode,
  ApiErrorResponse,
} from './types';
import {
  mockListArticles,
  mockStartAttempt,
  mockSubmitAttempt,
  mockRevealArticle,
  mockGetHistory,
  MockApiError,
} from './mock';

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(code: ApiErrorCode, message: string, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === undefined
    ? true
    : process.env.NEXT_PUBLIC_USE_MOCK === 'true' ||
      process.env.NEXT_PUBLIC_USE_MOCK === '1';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

export function isMockMode(): boolean {
  return USE_MOCK;
}

/**
 * Shared fetch wrapper with 15s AbortController timeout and typed error parsing
 */
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorCode: ApiErrorCode = 'SERVER_ERROR';
      let errorMessage = `Request failed with status ${response.status}`;

      try {
        const errorData: ApiErrorResponse = await response.json();
        if (errorData?.error?.code) {
          errorCode = errorData.error.code;
          errorMessage = errorData.error.message || errorMessage;
        }
      } catch {
        // Fallback to text status
      }

      throw new ApiError(errorCode, errorMessage, response.status);
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(
        'SERVER_ERROR',
        'Request timed out after 15 seconds. Please try again.',
        504
      );
    }

    const message =
      err instanceof Error ? err.message : 'Network connection failure.';
    throw new ApiError('SERVER_ERROR', message, 500);
  }
}

/**
 * 1. GET /api/articles → ArticleSummary[]
 */
export async function listArticles(): Promise<ArticleSummary[]> {
  if (USE_MOCK) {
    try {
      return await mockListArticles();
    } catch (err) {
      if (err instanceof MockApiError) {
        throw new ApiError(err.code, err.message, err.status);
      }
      throw err;
    }
  }

  return fetchWithTimeout<ArticleSummary[]>('/api/articles', {
    method: 'GET',
  });
}

/**
 * 2. POST /api/attempts/start
 */
export async function startAttempt(
  payload: StartAttemptPayload
): Promise<StartAttemptResponse> {
  if (USE_MOCK) {
    try {
      return await mockStartAttempt(payload);
    } catch (err) {
      if (err instanceof MockApiError) {
        throw new ApiError(err.code, err.message, err.status);
      }
      throw err;
    }
  }

  return fetchWithTimeout<StartAttemptResponse>('/api/attempts/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 3. POST /api/attempts/{attemptId}/submit
 */
export async function submitAttempt(
  attemptId: string,
  payload: SubmitAttemptPayload
): Promise<EvaluationResult> {
  if (USE_MOCK) {
    try {
      return await mockSubmitAttempt(attemptId, payload);
    } catch (err) {
      if (err instanceof MockApiError) {
        throw new ApiError(err.code, err.message, err.status);
      }
      throw err;
    }
  }

  return fetchWithTimeout<EvaluationResult>(
    `/api/attempts/${encodeURIComponent(attemptId)}/submit`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * 4. GET /api/attempts/{attemptId}/reveal
 */
export async function revealArticle(
  attemptId: string
): Promise<RevealArticleResponse> {
  if (USE_MOCK) {
    try {
      return await mockRevealArticle(attemptId);
    } catch (err) {
      if (err instanceof MockApiError) {
        throw new ApiError(err.code, err.message, err.status);
      }
      throw err;
    }
  }

  return fetchWithTimeout<RevealArticleResponse>(
    `/api/attempts/${encodeURIComponent(attemptId)}/reveal`,
    {
      method: 'GET',
    }
  );
}

/**
 * 5. GET /api/history
 */
export async function getHistory(): Promise<HistoryResponse> {
  if (USE_MOCK) {
    try {
      return await mockGetHistory();
    } catch (err) {
      if (err instanceof MockApiError) {
        throw new ApiError(err.code, err.message, err.status);
      }
      throw err;
    }
  }

  return fetchWithTimeout<HistoryResponse>('/api/history', {
    method: 'GET',
  });
}
