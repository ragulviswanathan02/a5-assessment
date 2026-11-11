'use client';

import React, { useState, useMemo } from 'react';
import { QuestionReviewItem } from '@/types/database';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Printer,
  Filter,
  Check,
  X,
  FileQuestion,
  Sparkles,
} from 'lucide-react';

interface Props {
  review: QuestionReviewItem[];
  studentName?: string;
  paperTitle?: string;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  isAdmin?: boolean;
}

export default function QuestionReviewSection({
  review,
  studentName,
  paperTitle,
  totalScore,
  maxScore,
  percentage,
  isAdmin = false,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Compute summary stats
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    const topics = new Set<string>();

    review.forEach((q) => {
      if (q.topic) topics.add(q.topic);
      if (q.isSkipped) {
        skipped++;
      } else if (q.isCorrect) {
        correct++;
      } else {
        incorrect++;
      }
    });

    return {
      total: review.length,
      correct,
      incorrect,
      skipped,
      topics: Array.from(topics),
    };
  }, [review]);

  // Filtered review list
  const filteredReview = useMemo(() => {
    return review.filter((q) => {
      // 1. Status Filter
      if (filter === 'correct' && !q.isCorrect) return false;
      if (filter === 'incorrect' && (q.isCorrect || q.isSkipped)) return false;
      if (filter === 'skipped' && !q.isSkipped) return false;

      // 2. Topic Filter
      if (selectedTopic !== 'all' && q.topic !== selectedTopic) return false;

      return true;
    });
  }, [review, filter, selectedTopic]);

  const handlePrint = () => {
    window.print();
  };

  if (!review || review.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
        <FileQuestion className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p>Detailed question review is not available for this assessment.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6 text-left">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Detailed Question Breakdown &amp; Solutions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Review each question, option selected, correct answer key, and marks gained.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="no-print self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer shadow-2xs transition-all active:scale-95"
          title="Print or Save PDF of this answer review"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Summary Chips / Filter Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Questions ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setFilter('correct')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'correct'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Correct ({stats.correct})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('incorrect')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'incorrect'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Incorrect ({stats.incorrect})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('skipped')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'skipped'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Skipped ({stats.skipped})</span>
          </button>
        </div>

        {/* Topic dropdown filter if multiple topics exist */}
        {stats.topics.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Topic:</span>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Topics</option>
              {stats.topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Printable Sheet Header (visible when printed) */}
      <div className="hidden print:block mb-4 pb-3 border-b border-slate-300">
        <h2 className="text-xl font-bold text-slate-900">{paperTitle || 'Assessment Results Sheet'}</h2>
        <div className="text-xs text-slate-600 flex justify-between mt-1">
          <span>Student: <strong>{studentName || 'Candidate'}</strong></span>
          <span>Score: <strong>{totalScore} / {maxScore} ({percentage}%)</strong></span>
        </div>
      </div>

      {/* List of Question Cards */}
      <div className="space-y-4">
        {filteredReview.map((q, idx) => {
          const isCorrect = q.isCorrect;
          const isSkipped = q.isSkipped;
          const isIncorrect = !isCorrect && !isSkipped;

          // Border color based on status
          const borderClass = isCorrect
            ? 'border-emerald-300 ring-1 ring-emerald-100 bg-white'
            : isIncorrect
            ? 'border-rose-300 ring-1 ring-rose-100 bg-white'
            : 'border-amber-200 ring-1 ring-amber-50 bg-white';

          return (
            <div
              key={q.questionId || idx}
              className={`border rounded-2xl p-4 sm:p-5 transition-shadow ${borderClass}`}
            >
              {/* Card Top Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Question {idx + 1}
                  </span>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {q.topic || 'General'}
                  </span>
                  <span className="text-2xs font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 capitalize">
                    {q.questionType.replace('_', ' ')}
                  </span>
                </div>

                {/* Score & Status Badge */}
                <div className="flex items-center gap-2">
                  {isCorrect && (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Correct
                    </span>
                  )}
                  {isIncorrect && (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      <XCircle className="w-3 h-3" />
                      Incorrect
                    </span>
                  )}
                  {isSkipped && (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      <HelpCircle className="w-3 h-3" />
                      Not Answered
                    </span>
                  )}

                  {/* Marks Awarded Pill */}
                  <span
                    className={`text-2xs font-black px-2.5 py-0.5 rounded-md ${
                      q.marksAwarded > 0
                        ? 'bg-emerald-600 text-white'
                        : q.marksAwarded < 0
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {q.marksAwarded > 0 ? `+${q.marksAwarded}` : q.marksAwarded} / {q.maxMarks} m
                  </span>
                </div>
              </div>

              {/* Question Statement */}
              <div className="text-sm font-semibold text-slate-900 mb-4 leading-relaxed whitespace-pre-wrap">
                {q.questionText}
              </div>

              {/* Options Rendering */}
              {q.questionType === 'single_choice' || q.questionType === 'multiple_choice' ? (
                <div className="space-y-2 mb-3">
                  {q.options.map((opt, optIdx) => {
                    const correctIndices = (q.correctAnswers || []).map(Number);
                    const isOptionCorrect = correctIndices.includes(optIdx);

                    // Check if student selected this option
                    let isOptionSelected = false;
                    if (q.questionType === 'single_choice') {
                      isOptionSelected =
                        q.studentAnswer !== undefined &&
                        q.studentAnswer !== null &&
                        Number(q.studentAnswer) === optIdx;
                    } else {
                      const studentArr = Array.isArray(q.studentAnswer)
                        ? q.studentAnswer.map(Number)
                        : [];
                      isOptionSelected = studentArr.includes(optIdx);
                    }

                    // Style configuration
                    let containerStyle = 'border-slate-200 bg-slate-50/50 text-slate-700';
                    let badge = null;

                    if (isOptionSelected && isOptionCorrect) {
                      containerStyle =
                        'border-emerald-400 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-200';
                      badge = (
                        <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Your Answer (Correct)
                        </span>
                      );
                    } else if (isOptionSelected && !isOptionCorrect) {
                      containerStyle =
                        'border-rose-400 bg-rose-50 text-rose-950 font-medium ring-1 ring-rose-200';
                      badge = (
                        <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shrink-0">
                          <X className="w-3 h-3 stroke-[3]" />
                          Your Answer (Wrong)
                        </span>
                      );
                    } else if (!isOptionSelected && isOptionCorrect) {
                      containerStyle =
                        'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-medium';
                      badge = (
                        <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                          <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                          Correct Answer
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs leading-relaxed transition-colors ${containerStyle}`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-white border border-slate-300 text-2xs font-bold text-slate-600 shrink-0 mt-0.5">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="pt-0.5">{opt}</span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Text Input / Typing Response Review */
                <div className="space-y-2 mb-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Candidate Answer:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-md inline-block ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : isSkipped
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {q.studentAnswer ? `"${String(q.studentAnswer)}"` : '(Left Blank / Unanswered)'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 pt-1">
                    <span className="text-slate-500 font-medium">Accepted Answer(s):</span>
                    <div className="flex flex-wrap gap-1">
                      {q.correctAnswers && q.correctAnswers.length > 0 ? (
                        q.correctAnswers.map((ans, aIdx) => (
                          <span
                            key={aIdx}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md font-mono font-medium"
                          >
                            {String(ans)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No exact key specified</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Explanation / Key Concept Box */}
              {q.explanation && q.explanation.trim().length > 0 && (
                <div className="mt-3 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="font-bold text-amber-900 block mb-0.5">
                      Explanation / Key Concept:
                    </strong>
                    <span>{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredReview.length === 0 && (
          <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs">
            No questions match the current &quot;{filter}&quot; filter.
          </div>
        )}
      </div>
    </div>
  );
}

