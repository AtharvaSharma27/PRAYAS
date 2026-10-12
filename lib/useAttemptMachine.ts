import { useReducer, useCallback, useEffect } from 'react';
import { FlowStage, EvaluationResult, StartAttemptResponse, StartAttemptPayload } from './types';
import { ApiError, submitAttempt, startAttempt } from './api';

export interface AttemptMachineState {
  stage: FlowStage;
  attemptId: string | null;
  articleId: string | null;
  customText: string | null;
  customTitle: string | null;
  articleTitle: string | null;
  articleText: string | null; // MUST be null in writing/result stage
  wordCount: number;
  readingSeconds: number;
  readingStartTime: number | null;
  writingStartTime: number | null;
  tabSwitches: number;
  pastedChars: number;
  summary: string;
  isEvaluating: boolean;
  evaluationError: ApiError | null;
  result: EvaluationResult | null;
}

export type AttemptAction =
  | {
      type: 'START_READING';
      payload: {
        response: StartAttemptResponse;
        originalPayload: StartAttemptPayload;
      };
    }
  | { type: 'FINISH_READING' }
  | { type: 'INCREMENT_TAB_SWITCH' }
  | { type: 'RECORD_PASTE'; charsCount: number }
  | { type: 'UPDATE_SUMMARY'; text: string }
  | { type: 'START_EVALUATION' }
  | { type: 'EVALUATION_SUCCESS'; result: EvaluationResult }
  | { type: 'EVALUATION_ERROR'; error: ApiError }
  | { type: 'RESET_TO_SELECT' }
  | { type: 'RETRY_ARTICLE' };

export const initialState: AttemptMachineState = {
  stage: 'select',
  attemptId: null,
  articleId: null,
  customText: null,
  customTitle: null,
  articleTitle: null,
  articleText: null,
  wordCount: 0,
  readingSeconds: 60,
  readingStartTime: null,
  writingStartTime: null,
  tabSwitches: 0,
  pastedChars: 0,
  summary: '',
  isEvaluating: false,
  evaluationError: null,
  result: null,
};

export function attemptReducer(
  state: AttemptMachineState,
  action: AttemptAction
): AttemptMachineState {
  switch (action.type) {
    case 'START_READING': {
      const { response, originalPayload } = action.payload;
      return {
        ...state,
        stage: 'reading',
        attemptId: response.attemptId,
        articleId: originalPayload.articleId || null,
        customText: originalPayload.customText || null,
        customTitle: originalPayload.customTitle || null,
        articleTitle: response.article.title,
        articleText: response.article.text,
        wordCount: response.article.wordCount,
        readingSeconds: response.readingSeconds,
        readingStartTime: Date.now(),
        writingStartTime: null,
        tabSwitches: 0,
        pastedChars: 0,
        summary: '',
        isEvaluating: false,
        evaluationError: null,
        result: null,
      };
    }

    case 'FINISH_READING': {
      // REQUIREMENT: Article text MUST be REMOVED from the React tree and state (set to null)
      return {
        ...state,
        stage: 'writing',
        articleText: null, // Purged!
        writingStartTime: Date.now(),
      };
    }

    case 'INCREMENT_TAB_SWITCH': {
      return {
        ...state,
        tabSwitches: state.tabSwitches + 1,
      };
    }

    case 'RECORD_PASTE': {
      return {
        ...state,
        pastedChars: state.pastedChars + action.charsCount,
      };
    }

    case 'UPDATE_SUMMARY': {
      return {
        ...state,
        summary: action.text,
      };
    }

    case 'START_EVALUATION': {
      return {
        ...state,
        isEvaluating: true,
        evaluationError: null,
      };
    }

    case 'EVALUATION_SUCCESS': {
      return {
        ...state,
        stage: 'result',
        isEvaluating: false,
        evaluationError: null,
        result: action.result,
        articleText: null, // Ensure still null
      };
    }

    case 'EVALUATION_ERROR': {
      return {
        ...state,
        isEvaluating: false,
        evaluationError: action.error,
      };
    }

    case 'RESET_TO_SELECT': {
      return {
        ...initialState,
      };
    }

    case 'RETRY_ARTICLE': {
      // Preserves article selection info, but resets session
      return {
        ...state,
        stage: 'select',
        summary: '',
        isEvaluating: false,
        evaluationError: null,
        result: null,
        articleText: null,
        tabSwitches: 0,
        pastedChars: 0,
      };
    }

    default:
      return state;
  }
}

export function useAttemptMachine() {
  const [state, dispatch] = useReducer(attemptReducer, initialState);

  // Tab switch listener during reading and writing
  useEffect(() => {
    if (state.stage !== 'reading' && state.stage !== 'writing') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        dispatch({ type: 'INCREMENT_TAB_SWITCH' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.stage]);

  const handleStartAttempt = useCallback(
    async (payload: StartAttemptPayload) => {
      const response = await startAttempt(payload);
      dispatch({
        type: 'START_READING',
        payload: {
          response,
          originalPayload: payload,
        },
      });
      return response;
    },
    []
  );

  const handleFinishReading = useCallback(() => {
    dispatch({ type: 'FINISH_READING' });
  }, []);

  const handleRecordPaste = useCallback((charsCount: number) => {
    dispatch({ type: 'RECORD_PASTE', charsCount });
  }, []);

  const handleUpdateSummary = useCallback((text: string) => {
    dispatch({ type: 'UPDATE_SUMMARY', text });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!state.attemptId) return;

    dispatch({ type: 'START_EVALUATION' });

    const writingSeconds = state.writingStartTime
      ? Math.max(1, Math.round((Date.now() - state.writingStartTime) / 1000))
      : 30;

    try {
      const result = await submitAttempt(state.attemptId, {
        summary: state.summary,
        tabSwitches: state.tabSwitches,
        pastedChars: state.pastedChars,
        writingSeconds,
      });

      dispatch({ type: 'EVALUATION_SUCCESS', result });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        dispatch({ type: 'EVALUATION_ERROR', error: err });
      } else {
        dispatch({
          type: 'EVALUATION_ERROR',
          error: new ApiError(
            'SERVER_ERROR',
            err instanceof Error ? err.message : 'Evaluation failed. Please try again.'
          ),
        });
      }
    }
  }, [state.attemptId, state.summary, state.tabSwitches, state.pastedChars, state.writingStartTime]);

  const handleRetryCurrentArticle = useCallback(async () => {
    if (state.articleId) {
      return handleStartAttempt({ articleId: state.articleId });
    }
    if (state.customText) {
      return handleStartAttempt({
        customText: state.customText,
        customTitle: state.customTitle || undefined,
      });
    }
    dispatch({ type: 'RESET_TO_SELECT' });
  }, [state.articleId, state.customText, state.customTitle, handleStartAttempt]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_TO_SELECT' });
  }, []);

  return {
    state,
    dispatch,
    handleStartAttempt,
    handleFinishReading,
    handleRecordPaste,
    handleUpdateSummary,
    handleSubmit,
    handleRetryCurrentArticle,
    handleReset,
  };
}
