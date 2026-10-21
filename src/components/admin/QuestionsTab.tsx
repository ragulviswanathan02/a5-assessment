'use client';

import React, { useState } from 'react';
import { Paper, Question, QuestionType } from '@/types/database';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Tag,
  FileQuestion,
  Sparkles,
  HelpCircle,
  Check,
  CheckSquare,
  Type,
  List,
} from 'lucide-react';

interface Props {
  papers: Paper[];
  selectedPaperId: string;
  onSelectPaperId: (id: string) => void;
  questions: Question[];
  onRefresh: () => void;
}

export default function QuestionsTab({
  papers,
  selectedPaperId,
  onSelectPaperId,
  questions,
  onRefresh,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [questionText, setQuestionText] = useState('');
  const [topic, setTopic] = useState('Aptitude');
  const [questionType, setQuestionType] = useState<QuestionType>('single_choice');
  const [marks, setMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [explanation, setExplanation] = useState('');

  // Options for Choice questions
  const [options, setOptions] = useState<string[]>([
    'Option A',
    'Option B',
    'Option C',
    'Option D',
  ]);
  // Single choice: single index
  const [singleCorrectIndex, setSingleCorrectIndex] = useState<number>(0);
  // Multi choice: set of indices
  const [multiCorrectIndices, setMultiCorrectIndices] = useState<number[]>([0]);
  // Typing question: comma separated accepted answers
  const [typingAcceptedAnswers, setTypingAcceptedAnswers] = useState('Answer 1, Answer 2');

  const topicSuggestions = ['Aptitude', 'Reasoning', 'Verbal', 'Python', 'Web Development', 'Database', 'Soft Skills'];

  // Handle Option text edit
  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleAddOption = () => {
    setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    if (singleCorrectIndex >= updated.length) setSingleCorrectIndex(0);
    setMultiCorrectIndices(multiCorrectIndices.filter((i) => i !== idx));
  };

  const handleToggleMultiIndex = (idx: number) => {
    if (multiCorrectIndices.includes(idx)) {
      if (multiCorrectIndices.length > 1) {
        setMultiCorrectIndices(multiCorrectIndices.filter((i) => i !== idx));
      }
    } else {
      setMultiCorrectIndices([...multiCorrectIndices, idx].sort((a, b) => a - b));
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    try {
      setLoading(true);

      let correctAnswersToSave: (number | string)[] = [];
      let finalOptions: string[] = [];

      if (questionType === 'single_choice') {
        finalOptions = options.map((o) => o.trim()).filter(Boolean);
        correctAnswersToSave = [singleCorrectIndex];
      } else if (questionType === 'multiple_choice') {
        finalOptions = options.map((o) => o.trim()).filter(Boolean);
        correctAnswersToSave = multiCorrectIndices;
      } else if (questionType === 'text_input') {
        finalOptions = [];
        correctAnswersToSave = typingAcceptedAnswers
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
      }

      const { error } = await supabase.from('questions').insert({
        paper_id: selectedPaperId,
        question_text: questionText.trim(),
        question_type: questionType,
        topic: topic.trim() || 'General',
        options: finalOptions,
        correct_answers: correctAnswersToSave,
        marks: Number(marks) || 1,
        negative_marks: Number(negativeMarks) || 0,
        explanation: explanation.trim(),
        order_index: questions.length + 1,
      });

      if (error) throw error;

      setShowAddModal(false);
      setQuestionText('');
      setExplanation('');
      onRefresh();
    } catch (err: any) {
      alert('Failed to add question: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      setLoading(true);
      await supabase.from('questions').delete().eq('id', qId);
      onRefresh();
    } catch (err: any) {
      alert('Failed to delete question: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Paper Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Questions For Assessment Paper
          </label>
          <select
            value={selectedPaperId}
            onChange={(e) => onSelectPaperId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.is_active ? '🟢 (LIVE)' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  <Tag className="w-3 h-3 text-indigo-500" />
                  {q.topic}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium capitalize">
                  {q.question_type.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  +{q.marks} Mark{q.marks > 1 ? 's' : ''}
                </span>
                {q.negative_marks > 0 && (
                  <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                    -{q.negative_marks} Neg
                  </span>
                )}
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">
              {q.question_text}
            </p>

            {/* Answer Display */}
            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
              {q.question_type === 'single_choice' && (
                <div className="space-y-1">
                  {(q.options || []).map((opt, oIdx) => {
                    const isCorrect = Number(q.correct_answers?.[0]) === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`flex items-center gap-2 p-1.5 rounded-lg ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-800 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isCorrect ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                          }`}
                        />
                        <span>{opt}</span>
                        {isCorrect && <span className="ml-auto text-[10px] text-emerald-600">✓ Correct Key</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'multiple_choice' && (
                <div className="space-y-1">
                  {(q.options || []).map((opt, oIdx) => {
                    const correctIndices = (q.correct_answers || []).map(Number);
                    const isCorrect = correctIndices.includes(oIdx);
                    return (
                      <div
                        key={oIdx}
                        className={`flex items-center gap-2 p-1.5 rounded-lg ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-800 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                            isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isCorrect && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span>{opt}</span>
                        {isCorrect && <span className="ml-auto text-[10px] text-emerald-600">✓ Correct Key</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'text_input' && (
                <div className="text-slate-700">
                  <span className="font-semibold text-slate-900">Accepted Answer(s): </span>
                  {(q.correct_answers || []).map((ans, aIdx) => (
                    <span
                      key={aIdx}
                      className="inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono text-[11px] mr-1.5"
                    >
                      &quot;{ans}&quot;
                    </span>
                  ))}
                  <span className="text-[11px] text-slate-400 block mt-1">
                    (Student typing will be matched case-insensitively with whitespace trimmed)
                  </span>
                </div>
              )}
            </div>

            {q.explanation && (
              <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                💡 Explanation: {q.explanation}
              </p>
            )}
          </div>
        ))}

        {questions.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
            <FileQuestion className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Questions Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Click &quot;Add New Question&quot; to add Single Select, Multi-Select, or Typing questions for this paper.
            </p>
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="font-bold text-slate-900 text-base">Create Assessment Question</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs md:text-sm">
              {/* Question Text */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Question Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the full question text here..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Question Type Selection Cards */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Question Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setQuestionType('single_choice')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      questionType === 'single_choice'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <List className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="text-xs">Single Choice</div>
                      <div className="text-[10px] text-slate-500 font-normal">Radio MCQ</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setQuestionType('multiple_choice')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      questionType === 'multiple_choice'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="text-xs">Multi-Select</div>
                      <div className="text-[10px] text-slate-500 font-normal">Multiple keys</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setQuestionType('text_input')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      questionType === 'text_input'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Type className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="text-xs">Typing / Short Ans</div>
                      <div className="text-[10px] text-slate-500 font-normal">Student types text</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topic & Suggestion Pills */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Topic / Category <span className="text-slate-400 font-normal">(Used for graph analytics)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aptitude, Python, Database"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 mb-1.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {topicSuggestions.map((top) => (
                    <button
                      key={top}
                      type="button"
                      onClick={() => setTopic(top)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        topic === top
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {top}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Answer Key Configuration based on Type */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                {/* 1. SINGLE CHOICE OPTIONS */}
                {questionType === 'single_choice' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-xs">
                        Choices & Correct Radio Key:
                      </span>
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                      >
                        + Add Choice
                      </button>
                    </div>

                    {options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="single_correct"
                          checked={singleCorrectIndex === oIdx}
                          onChange={() => setSingleCorrectIndex(oIdx)}
                          className="w-4 h-4 text-indigo-600"
                          title="Select as correct answer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(oIdx)}
                            className="text-slate-400 hover:text-rose-600 text-xs"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. MULTI SELECT OPTIONS */}
                {questionType === 'multiple_choice' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-xs">
                        Choices & Check All Correct Keys:
                      </span>
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                      >
                        + Add Choice
                      </button>
                    </div>

                    {options.map((opt, oIdx) => {
                      const isChecked = multiCorrectIndices.includes(oIdx);
                      return (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleMultiIndex(oIdx)}
                            className="w-4 h-4 rounded text-indigo-600"
                            title="Check as one of the correct answers"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                          />
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(oIdx)}
                              className="text-slate-400 hover:text-rose-600 text-xs"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. TYPING / SHORT ANSWER */}
                {questionType === 'text_input' && (
                  <div>
                    <label className="block font-semibold text-slate-800 text-xs mb-1">
                      Accepted Correct Answer(s) (comma-separated):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DROP TABLE, DROP"
                      value={typingAcceptedAnswers}
                      onChange={(e) => setTypingAcceptedAnswers(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Student response will be matched case-insensitively. You can add aliases separated by commas.
                    </p>
                  </div>
                )}
              </div>

              {/* Marks & Negative Marks */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marks for Correct (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Negative Marks (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              {/* Explanation Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Explanation / Solution (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional hint or explanation of correct answer"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
