'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, Award, BarChart3, Clock, AlertCircle } from 'lucide-react';

interface Props {
  paperTitle: string;
  studentName: string;
  showResultsImmediately: boolean;
  result?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    topicScores: Record<string, { scored: number; total: number; percentage: number }>;
  } | null;
  onReset?: () => void;
}

export default function ResultScreen({
  paperTitle,
  studentName,
  showResultsImmediately,
  result,
  onReset,
}: Props) {
  useEffect(() => {
    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto my-10 px-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9" />
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
          Assessment Submitted!
        </h1>
        <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto mb-6">
          Thank you, <span className="font-semibold text-slate-800">{studentName}</span>. Your test submission for <span className="font-medium text-slate-800">{paperTitle}</span> has been securely recorded.
        </p>

        {showResultsImmediately && result ? (
          <div className="space-y-6 text-left">
            {/* Score Summary Box */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-indigo-50/30 to-purple-50/50 border border-indigo-100 rounded-2xl p-6 text-center">
              <span className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">
                Overall Performance
              </span>
              <div className="mt-2 flex items-baseline justify-center gap-2">
                <span className="text-4xl md:text-5xl font-black text-slate-900">
                  {result.totalScore}
                </span>
                <span className="text-lg md:text-xl font-medium text-slate-500">
                  / {result.maxScore} marks
                </span>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                <Award className="w-4 h-4" />
                Score: {result.percentage}%
              </div>
            </div>

            {/* Topic-wise Breakdown */}
            {result.topicScores && Object.keys(result.topicScores).length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Performance by Topic
                </h3>

                <div className="space-y-3.5">
                  {Object.entries(result.topicScores).map(([topic, data]) => (
                    <div key={topic} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-700">{topic}</span>
                        <span className="text-slate-600">
                          {data.scored} / {data.total} ({data.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            data.percentage >= 75
                              ? 'bg-emerald-500'
                              : data.percentage >= 40
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, data.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Institutional notice when results are held */
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-700">
            <Clock className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-900 mb-1">Results Pending Review</h3>
            <p className="text-xs md:text-sm text-slate-600 max-w-sm mx-auto">
              The administrator has set this assessment to private evaluation mode. Results and merit lists will be published directly through the institute website.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          {onReset && (
            <button
              onClick={onReset}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all cursor-pointer"
            >
              Done / Return Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
