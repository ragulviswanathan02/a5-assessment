'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Question, Paper } from '@/types/database';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Send,
  RotateCcw,
  Menu,
  X,
  FileQuestion,
  HelpCircle,
  Tag,
} from 'lucide-react';

interface Props {
  paper: Paper;
  questions: Question[];
  studentData: Record<string, string>;
  onSubmit: (answers: Record<string, any>, tabSwitches: number, timeTakenSeconds: number) => void;
  isSubmitting: boolean;
}

export default function ExamInterface({
  paper,
  questions,
  studentData,
  onSubmit,
  isSubmitting,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Timer logic
  const totalSeconds = (paper.duration_minutes || 0) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds > 0 ? totalSeconds : 999999);
  const [startTime] = useState(Date.now());

  // Handle final submission
  const handleFinalSubmit = useCallback(() => {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    onSubmit(answers, tabSwitches, elapsedSeconds);
  }, [answers, tabSwitches, startTime, onSubmit]);

  // Countdown timer effect
  useEffect(() => {
    if (totalSeconds <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [totalSeconds, handleFinalSubmit]);

  // Tab switch listener (Anti-Cheat)
  useEffect(() => {
    if (!paper.track_tab_switches) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
        setShowSwitchWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [paper.track_tab_switches]);

  const currentQ = questions[currentIndex] || questions[0];

  // Helper formatting for time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Answer handling
  const handleSingleSelect = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIndex }));
  };

  const handleMultiSelect = (optionIndex: number) => {
    const currentList: number[] = Array.isArray(answers[currentQ.id]) ? [...answers[currentQ.id]] : [];
    const exists = currentList.includes(optionIndex);
    let updated: number[];
    if (exists) {
      updated = currentList.filter((idx) => idx !== optionIndex);
    } else {
      updated = [...currentList, optionIndex].sort((a, b) => a - b);
    }
    setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
  };

  const handleTextInput = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const toggleReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  // Question status checks
  const getQuestionStatus = (qId: string) => {
    const isAnswered =
      answers[qId] !== undefined &&
      answers[qId] !== null &&
      (Array.isArray(answers[qId]) ? answers[qId].length > 0 : String(answers[qId]).trim() !== '');

    const isReview = !!markedForReview[qId];

    if (isReview && isAnswered) return 'review-answered';
    if (isReview) return 'review';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  // Answer stats
  const stats = useMemo(() => {
    let answered = 0;
    let review = 0;
    questions.forEach((q) => {
      const isAns =
        answers[q.id] !== undefined &&
        answers[q.id] !== null &&
        (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : String(answers[q.id]).trim() !== '');
      if (isAns) answered++;
      if (markedForReview[q.id]) review++;
    });
    return {
      answered,
      unanswered: questions.length - answered,
      review,
    };
  }, [questions, answers, markedForReview]);

  const studentDisplayName =
    studentData.full_name || studentData.name || Object.values(studentData)[0] || 'Candidate';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              A5
            </div>
            <div>
              <h1 className="text-sm md:text-base font-semibold text-slate-900 leading-tight line-clamp-1">
                {paper.title}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Candidate: <span className="font-medium text-slate-700">{studentDisplayName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Countdown Timer */}
            {totalSeconds > 0 && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  secondsRemaining < 300
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            )}

            {/* Mobile Question Palette Toggle */}
            <button
              onClick={() => setPaletteOpen(!paletteOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="Toggle Question Palette"
            >
              {paletteOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Final Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Submit Test</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Switch Warning Banner */}
      {showSwitchWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-800 text-xs md:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Warning:</strong> Tab switch detected! (Total: {tabSwitches}). Please remain on the test page to avoid disqualification.
            </span>
          </div>
          <button
            onClick={() => setShowSwitchWarning(false)}
            className="text-amber-800 hover:text-amber-950 font-bold ml-4 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Question Workspace */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 shadow-xs">
            {/* Question Meta Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                {currentQ.topic && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium">
                    <Tag className="w-3 h-3" />
                    {currentQ.topic}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                  +{currentQ.marks || 1} mark{currentQ.marks > 1 ? 's' : ''}
                </span>
                {currentQ.negative_marks > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-medium">
                    -{currentQ.negative_marks} neg
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                  {currentQ.question_type.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <h2 className="text-base md:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                {currentQ.question_text}
              </h2>
            </div>

            {/* Question Answers Body according to Question Type */}
            <div className="space-y-3 mb-6">
              {/* 1. SINGLE CHOICE (Radio) */}
              {currentQ.question_type === 'single_choice' && (
                <div className="space-y-2.5">
                  {(currentQ.options || []).map((opt, oIndex) => {
                    const isSelected = answers[currentQ.id] === oIndex;
                    return (
                      <label
                        key={oIndex}
                        onClick={() => handleSingleSelect(oIndex)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="flex-1 leading-normal">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 2. MULTIPLE CHOICE (Checkboxes) */}
              {currentQ.question_type === 'multiple_choice' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-indigo-600 font-medium mb-1">
                    ✓ Multiple options can be correct. Select all that apply:
                  </p>
                  {(currentQ.options || []).map((opt, oIndex) => {
                    const selectedList: number[] = Array.isArray(answers[currentQ.id])
                      ? answers[currentQ.id]
                      : [];
                    const isSelected = selectedList.includes(oIndex);

                    return (
                      <label
                        key={oIndex}
                        onClick={() => handleMultiSelect(oIndex)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="flex-1 leading-normal">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 3. TEXT INPUT / TYPING */}
              {currentQ.question_type === 'text_input' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-1">
                    ✏️ Type your exact answer below (case-insensitive):
                  </p>
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleTextInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              )}
            </div>

            {/* Question Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs md:text-sm">
              <button
                onClick={toggleReview}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  markedForReview[currentQ.id]
                    ? 'bg-purple-50 border-purple-300 text-purple-700 font-medium'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              <button
                onClick={handleClearAnswer}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear Response</span>
              </button>
            </div>
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 mt-4">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-xs cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Review & Submit</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Question Palette (Sticky on Desktop, Modal on Mobile) */}
        <aside
          className={`lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit ${
            paletteOpen ? 'fixed inset-x-4 top-20 z-40 max-h-[80vh] overflow-y-auto' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileQuestion className="w-4 h-4 text-indigo-600" />
              Question Palette
            </h3>
            {paletteOpen && (
              <button
                onClick={() => setPaletteOpen(false)}
                className="text-slate-400 hover:text-slate-600 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-4 p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
              <span className="text-slate-600">Answered ({stats.answered})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300" />
              <span className="text-slate-600">Unanswered ({stats.unanswered})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-purple-500" />
              <span className="text-slate-600">Review ({stats.review})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded ring-2 ring-indigo-600 bg-white" />
              <span className="text-slate-600">Current</span>
            </div>
          </div>

          {/* Question Grid Buttons */}
          <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(q.id);
              const isCurrent = idx === currentIndex;

              let style = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
              if (status === 'answered') {
                style = 'bg-emerald-600 text-white font-medium hover:bg-emerald-700';
              } else if (status === 'review' || status === 'review-answered') {
                style = 'bg-purple-600 text-white font-medium hover:bg-purple-700';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    if (paletteOpen) setPaletteOpen(false);
                  }}
                  className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${style} ${
                    isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2 scale-105' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </main>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ready to Submit?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please verify your responses before completing the assessment.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs mb-5">
              <div>
                <span className="block text-emerald-600 font-bold text-base">{stats.answered}</span>
                <span className="text-slate-500">Answered</span>
              </div>
              <div>
                <span className="block text-slate-600 font-bold text-base">{stats.unanswered}</span>
                <span className="text-slate-500">Unanswered</span>
              </div>
              <div>
                <span className="block text-purple-600 font-bold text-base">{stats.review}</span>
                <span className="text-slate-500">Review</span>
              </div>
            </div>

            {tabSwitches > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg mb-4 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Note: {tabSwitches} tab switch(es) recorded during this test session.
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
              >
                Back to Test
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
