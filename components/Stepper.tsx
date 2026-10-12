'use client';

import { FlowStage } from '@/lib/types';
import { Check, BookOpen, Clock, PenTool, Award } from 'lucide-react';

interface StepperProps {
  currentStage: FlowStage;
}

interface StepItem {
  id: FlowStage;
  label: string;
  sublabel: string;
  icon: typeof BookOpen;
}

const steps: StepItem[] = [
  { id: 'select', label: '1. Select', sublabel: 'Pick article', icon: BookOpen },
  { id: 'reading', label: '2. Read', sublabel: 'Timed review', icon: Clock },
  { id: 'writing', label: '3. Write', sublabel: 'Synthesize gist', icon: PenTool },
  { id: 'result', label: '4. Result', sublabel: 'Score & feedback', icon: Award },
];

const stageIndexMap: Record<FlowStage, number> = {
  select: 0,
  reading: 1,
  writing: 2,
  result: 3,
};

export function Stepper({ currentStage }: StepperProps) {
  const currentIndex = stageIndexMap[currentStage];

  return (
    <nav aria-label="Assessment Progress" className="w-full mb-8">
      <ol className="grid grid-cols-4 gap-2 sm:gap-4 max-w-4xl mx-auto">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <li
              key={step.id}
              className="relative flex flex-col items-center sm:items-start"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Connector line for large screens */}
              {idx < steps.length - 1 && (
                <div
                  className={`hidden sm:block absolute top-4 left-9 right-[-50%] h-0.5 z-0 transition-colors duration-300 ${
                    idx < currentIndex
                      ? 'bg-indigo-600 dark:bg-indigo-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                  aria-hidden="true"
                />
              )}

              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 z-10 w-full">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 shrink-0 ${
                    isCompleted
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/60 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <p
                    className={`text-xs sm:text-sm font-semibold transition-colors leading-tight ${
                      isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : isCompleted
                        ? 'text-slate-900 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {step.sublabel}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
