'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAttemptMachine } from '@/lib/useAttemptMachine';
import { Stepper } from '@/components/Stepper';
import { ArticleGrid } from '@/components/ArticleGrid';
import { ReadingView } from '@/components/ReadingView';
import { WritingView } from '@/components/WritingView';
import { ResultView } from '@/components/ResultView';

function AssessmentFlow() {
  const searchParams = useSearchParams();
  const paramArticleId = searchParams.get('articleId');
  const isCustomParam = searchParams.get('custom');
  const autoStartedRef = useRef(false);

  const {
    state,
    handleStartAttempt,
    handleFinishReading,
    handleRecordPaste,
    handleUpdateSummary,
    handleSubmit,
    handleRetryCurrentArticle,
    handleReset,
  } = useAttemptMachine();

  useEffect(() => {
    if (autoStartedRef.current || state.stage !== 'select') return;

    if (paramArticleId) {
      autoStartedRef.current = true;
      handleStartAttempt({ articleId: paramArticleId });
    } else if (isCustomParam === 'true') {
      try {
        const raw = sessionStorage.getItem('gistcheck_pending_custom');
        if (raw) {
          const { title, text } = JSON.parse(raw);
          sessionStorage.removeItem('gistcheck_pending_custom');
          autoStartedRef.current = true;
          handleStartAttempt({ customText: text, customTitle: title });
        }
      } catch (err) {
        console.error('Failed to load pending custom article', err);
      }
    }
  }, [paramArticleId, isCustomParam, state.stage, handleStartAttempt]);

  return (
    <div className="flex-1 flex flex-col py-6 sm:py-10">
      {/* Stage Stepper Header */}
      <div className="px-4 sm:px-6 mb-2">
        <Stepper currentStage={state.stage} />
      </div>

      {/* Main Flow Stage Machine */}
      <div className="flex-1 flex flex-col">
        {state.stage === 'select' && (
          <div className="animate-in fade-in duration-300">
            <ArticleGrid onStartAttempt={handleStartAttempt} />
          </div>
        )}

        {state.stage === 'reading' && state.articleTitle && state.articleText && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ReadingView
              title={state.articleTitle}
              text={state.articleText}
              wordCount={state.wordCount}
              readingSeconds={state.readingSeconds}
              tabSwitches={state.tabSwitches}
              onFinishReading={handleFinishReading}
            />
          </div>
        )}

        {state.stage === 'writing' && state.articleTitle && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <WritingView
              articleTitle={state.articleTitle}
              summary={state.summary}
              onUpdateSummary={handleUpdateSummary}
              onRecordPaste={handleRecordPaste}
              onSubmit={handleSubmit}
              isEvaluating={state.isEvaluating}
              evaluationError={state.evaluationError}
              onRetrySubmit={handleSubmit}
              onReset={handleReset}
            />
          </div>
        )}

        {state.stage === 'result' && state.result && (
          <div className="animate-in fade-in zoom-in-95 duration-400">
            <ResultView
              attemptId={state.attemptId}
              result={state.result}
              onRetryArticle={handleRetryCurrentArticle}
              onTryAnother={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-20 text-sm text-slate-500 font-medium">
          Preparing assessment...
        </div>
      }
    >
      <AssessmentFlow />
    </Suspense>
  );
}
