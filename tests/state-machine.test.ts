import { describe, it, expect } from 'vitest';
import { attemptReducer, initialState, AttemptMachineState } from '../lib/useAttemptMachine';
import { StartAttemptResponse, EvaluationResult } from '../lib/types';
import { ApiError } from '../lib/api';

describe('Attempt Flow State Machine (attemptReducer)', () => {
  it('starts at initial "select" stage with empty session data', () => {
    expect(initialState.stage).toBe('select');
    expect(initialState.articleText).toBeNull();
    expect(initialState.attemptId).toBeNull();
    expect(initialState.summary).toBe('');
  });

  it('transitions from "select" to "reading" and stores full article text on START_READING', () => {
    const mockResponse: StartAttemptResponse = {
      attemptId: 'att-123',
      article: {
        title: 'Understanding Event Loops',
        text: 'The event loop processes synchronous tasks and then microtasks...',
        wordCount: 220,
      },
      readingSeconds: 65,
    };

    const nextState = attemptReducer(initialState, {
      type: 'START_READING',
      payload: {
        response: mockResponse,
        originalPayload: { articleId: 'art-2' },
      },
    });

    expect(nextState.stage).toBe('reading');
    expect(nextState.attemptId).toBe('att-123');
    expect(nextState.articleTitle).toBe('Understanding Event Loops');
    expect(nextState.articleText).toBe(mockResponse.article.text);
    expect(nextState.wordCount).toBe(220);
    expect(nextState.readingSeconds).toBe(65);
    expect(nextState.readingStartTime).not.toBeNull();
  });

  it('CRITICAL REQUIREMENT: transitions to "writing" and PURGES article text (sets to null)', () => {
    const readingState: AttemptMachineState = {
      ...initialState,
      stage: 'reading',
      attemptId: 'att-123',
      articleTitle: 'Understanding Event Loops',
      articleText: 'Confidential source text that must disappear during writing',
      wordCount: 220,
      readingSeconds: 60,
    };

    const nextState = attemptReducer(readingState, { type: 'FINISH_READING' });

    expect(nextState.stage).toBe('writing');
    // Article text MUST be null in state
    expect(nextState.articleText).toBeNull();
    // Only title remains
    expect(nextState.articleTitle).toBe('Understanding Event Loops');
    expect(nextState.writingStartTime).not.toBeNull();
  });

  it('tracks tab switches and character-safe paste counts correctly', () => {
    let state = attemptReducer(initialState, { type: 'INCREMENT_TAB_SWITCH' });
    expect(state.tabSwitches).toBe(1);

    state = attemptReducer(state, { type: 'INCREMENT_TAB_SWITCH' });
    expect(state.tabSwitches).toBe(2);

    state = attemptReducer(state, { type: 'RECORD_PASTE', charsCount: 85 });
    expect(state.pastedChars).toBe(85);

    state = attemptReducer(state, { type: 'RECORD_PASTE', charsCount: 15 });
    expect(state.pastedChars).toBe(100);
  });

  it('handles summary updates, evaluation loading, and success transitions to "result"', () => {
    let state: AttemptMachineState = {
      ...initialState,
      stage: 'writing',
      attemptId: 'att-123',
      articleTitle: 'Understanding Event Loops',
      articleText: null,
    };

    state = attemptReducer(state, {
      type: 'UPDATE_SUMMARY',
      text: 'JavaScript executes on a single thread using an event loop to handle async callbacks.',
    });
    expect(state.summary).toContain('JavaScript executes');

    state = attemptReducer(state, { type: 'START_EVALUATION' });
    expect(state.isEvaluating).toBe(true);
    expect(state.evaluationError).toBeNull();

    const mockResult: EvaluationResult = {
      finalScore: 8,
      subScores: { mainIdea: 9, keyDetails: 8, ownWords: 8 },
      keyPointsCovered: ['JavaScript is single threaded'],
      keyPointsMissed: ['Microtasks run before timers'],
      feedback: 'Great comprehension.',
      tip: 'Mention microtasks next time.',
      source: 'hybrid',
      needsReview: false,
      latencyMs: 1200,
    };

    state = attemptReducer(state, { type: 'EVALUATION_SUCCESS', result: mockResult });
    expect(state.stage).toBe('result');
    expect(state.isEvaluating).toBe(false);
    expect(state.result).toEqual(mockResult);
    expect(state.articleText).toBeNull();
  });

  it('captures typed evaluation error and allows reset', () => {
    let state: AttemptMachineState = {
      ...initialState,
      stage: 'writing',
      attemptId: 'att-123',
      isEvaluating: true,
    };

    const error = new ApiError('RATE_LIMITED', 'Too many requests', 429);
    state = attemptReducer(state, { type: 'EVALUATION_ERROR', error });
    expect(state.isEvaluating).toBe(false);
    expect(state.evaluationError).toBe(error);

    state = attemptReducer(state, { type: 'RESET_TO_SELECT' });
    expect(state.stage).toBe('select');
    expect(state.attemptId).toBeNull();
  });
});
