'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { HistoryAttempt } from '@/lib/types';
import { TrendingUp, Target, BookOpen, PenTool } from 'lucide-react';

interface ScoreChartProps {
  attempts: HistoryAttempt[];
}

export function ScoreChart({ attempts }: ScoreChartProps) {
  if (!attempts || attempts.length === 0) {
    return null;
  }

  // Sort chronological for chart
  const sorted = [...attempts].reverse();

  const chartData = sorted.map((att, i) => {
    const d = new Date(att.createdAt);
    const dateFormatted = `${d.getMonth() + 1}/${d.getDate()}`;
    return {
      attemptIndex: i + 1,
      dateFormatted,
      title: att.articleTitle,
      score: att.finalScore,
      mainIdea: att.subScores?.mainIdea || 0,
      keyDetails: att.subScores?.keyDetails || 0,
      ownWords: att.subScores?.ownWords || 0,
    };
  });

  // Calculate averages
  const total = attempts.length;
  const avgFinal =
    Math.round((attempts.reduce((acc, a) => acc + a.finalScore, 0) / total) * 10) / 10;
  const avgMain =
    Math.round(
      (attempts.reduce((acc, a) => acc + (a.subScores?.mainIdea || 0), 0) / total) * 10
    ) / 10;
  const avgDetails =
    Math.round(
      (attempts.reduce((acc, a) => acc + (a.subScores?.keyDetails || 0), 0) / total) * 10
    ) / 10;
  const avgOwn =
    Math.round(
      (attempts.reduce((acc, a) => acc + (a.subScores?.ownWords || 0), 0) / total) * 10
    ) / 10;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Avg Final Score</span>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {avgFinal}
            <span className="text-xs text-slate-400 font-normal"> / 10</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>Avg Main Idea</span>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {avgMain}
            <span className="text-xs text-slate-400 font-normal"> / 10</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Avg Key Details</span>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {avgDetails}
            <span className="text-xs text-slate-400 font-normal"> / 10</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <PenTool className="w-3.5 h-3.5 text-purple-500" />
            <span>Avg Originality</span>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {avgOwn}
            <span className="text-xs text-slate-400 font-normal"> / 10</span>
          </p>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Comprehension Score Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Progression over your last {attempts.length} active recall attempts
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            Scale: 1–10
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-slate-100 dark:stroke-slate-800"
              />
              <XAxis
                dataKey="dateFormatted"
                tick={{ fontSize: 11 }}
                className="text-slate-400"
              />
              <YAxis
                domain={[0, 10]}
                ticks={[2, 4, 6, 8, 10]}
                tick={{ fontSize: 11 }}
                className="text-slate-400"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-700">
                        <p className="font-bold mb-1 max-w-[200px] truncate">{item.title}</p>
                        <p className="text-indigo-300 font-semibold">
                          Score: {item.score}/10
                        </p>
                        <div className="mt-1 pt-1 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                          <p>Main Idea: {item.mainIdea}/10</p>
                          <p>Key Details: {item.keyDetails}/10</p>
                          <p>Own Words: {item.ownWords}/10</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={7} stroke="#10b981" strokeDasharray="3 3" label="" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
