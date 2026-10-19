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
  { id: 'select',  label: '1. Select', sublabel: 'Pick article',      icon: BookOpen },
  { id: 'reading', label: '2. Read',   sublabel: 'Timed review',      icon: Clock    },
  { id: 'writing', label: '3. Write',  sublabel: 'Synthesize gist',   icon: PenTool  },
  { id: 'result',  label: '4. Result', sublabel: 'Score & feedback',  icon: Award    },
];

const stageIndexMap: Record<FlowStage, number> = {
  select:  0,
  reading: 1,
  writing: 2,
  result:  3,
};

export function Stepper({ currentStage }: StepperProps) {
  const currentIndex = stageIndexMap[currentStage];

  return (
    <nav aria-label="Assessment Progress" className="w-full max-w-full overflow-hidden mb-6 sm:mb-8">
      {/*
        Outer list: flex row, items spread across full width.
        `relative` lets the single background connector line span end-to-end
        behind all step nodes.
      */}
      <ol className="relative flex items-center justify-between max-w-4xl mx-auto px-3 sm:px-6">

        {/* Full-width connector line — runs through the vertical centre of the circles */}
        <div
          className="absolute inset-x-5 sm:inset-x-8 top-[16px] sm:top-[18px] h-px bg-slate-200"
          aria-hidden="true"
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent   = idx === currentIndex;
          const Icon = step.icon;

          return (
            <li
              key={step.id}
              className="relative flex items-center gap-2 sm:gap-2.5 z-10"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Step circle */}
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                )}
              </div>

              {/* Label — only show inline on desktop (md+) */}
              <div className="hidden md:block">
                <p
                  className={`text-sm font-semibold leading-tight transition-colors ${
                    isCurrent
                      ? 'text-indigo-600'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                  {step.sublabel}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* On mobile screens (< md), show active step below the dots */}
      <div className="md:hidden text-center mt-2.5">
        <span className="text-xs font-bold text-indigo-600">
          {steps[currentIndex].label}
        </span>
        <span className="text-xs text-slate-500 ml-1.5">
          — {steps[currentIndex].sublabel}
        </span>
      </div>
    </nav>
  );
}
