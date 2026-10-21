'use client';

import React, { useState, useEffect } from 'react';
import { Paper, Question, QuestionType } from '@/types/database';
import {
  Plus,
  Trash2,
  Tag,
  FileQuestion,
  Check,
  CheckSquare,
  Type,
  List,
  Loader2,
  AlertCircle,
  Pencil,
  Info,
  X,
  FolderPlus,
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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State (for both Add and Edit)
  const [questionText, setQuestionText] = useState('');
  const [topic, setTopic] = useState('General');
  const [questionType, setQuestionType] = useState<QuestionType>('single_choice');
  const [marks, setMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [explanation, setExplanation] = useState('');

  // Dynamic Predefined Topics State (No hardcoded CSE list)
  const [predefinedTopics, setPredefinedTopics] = useState<string[]>(['General', 'Aptitude']);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [showNewTopicBox, setShowNewTopicBox] = useState(false);

  // Load custom predefined topics on mount
  useEffect(() => {
    // 1. Fetch from server API
    fetch('/api/admin/topics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.topics) {
          setPredefinedTopics((prev) => {
            const merged = Array.from(new Set([...prev, ...data.topics]));
            return merged.length > 0 ? merged : ['General', 'Aptitude'];
          });
        }
      })
      .catch(() => {});

    // 2. Fetch from localStorage if exists
    try {
      const saved = localStorage.getItem('a5_predefined_topics');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPredefinedTopics((prev) => Array.from(new Set([...prev, ...parsed])));
        }
      }
    } catch (e) {}
  }, []);

  // Merge distinct topics from existing questions
  useEffect(() => {
    if (questions.length > 0) {
      const existingTopics = questions.map((q) => q.topic).filter(Boolean);
      setPredefinedTopics((prev) => Array.from(new Set([...prev, ...existingTopics])));
    }
  }, [questions]);

  // Options for Choice questions
  const [options, setOptions] = useState<string[]>([
    'Option A',
    'Option B',
    'Option C',
    'Option D',
  ]);
  const [singleCorrectIndex, setSingleCorrectIndex] = useState<number>(0);
  const [multiCorrectIndices, setMultiCorrectIndices] = useState<number[]>([0]);
  const [typingAcceptedAnswers, setTypingAcceptedAnswers] = useState('keyword 1, keyword 2');

  // Add a new custom topic
  const handleAddNewTopic = () => {
    if (!newTopicInput.trim()) return;
    const clean = newTopicInput.trim();
    if (!predefinedTopics.includes(clean)) {
      const updated = [...predefinedTopics, clean];
      setPredefinedTopics(updated);
      try {
        localStorage.setItem('a5_predefined_topics', JSON.stringify(updated));
      } catch (e) {}

      fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      }).catch(() => {});
    }

    setTopic(clean);
    setNewTopicInput('');
    setShowNewTopicBox(false);
  };

  // Delete a topic from predefined list
  const handleDeleteTopic = (topicName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = predefinedTopics.filter((t) => t !== topicName);
    setPredefinedTopics(updated);
    try {
      localStorage.setItem('a5_predefined_topics', JSON.stringify(updated));
    } catch (e) {}

    fetch(`/api/admin/topics?name=${encodeURIComponent(topicName)}`, {
      method: 'DELETE',
    }).catch(() => {});

    if (topic === topicName) {
      setTopic(updated[0] || 'General');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setQuestionText(q.question_text);
    setTopic(q.topic || 'General');
    setQuestionType(q.question_type);
    setMarks(Number(q.marks) || 1);
    setNegativeMarks(Number(q.negative_marks) || 0);
    setExplanation(q.explanation || '');

    if (q.question_type === 'single_choice') {
      setOptions(q.options && q.options.length > 0 ? [...q.options] : ['Option A', 'Option B']);
      setSingleCorrectIndex(Number(q.correct_answers?.[0]) || 0);
    } else if (q.question_type === 'multiple_choice') {
      setOptions(q.options && q.options.length > 0 ? [...q.options] : ['Option A', 'Option B']);
      setMultiCorrectIndices((q.correct_answers || []).map(Number));
    } else if (q.question_type === 'text_input') {
      setTypingAcceptedAnswers((q.correct_answers || []).join(', '));
    }

    setErrorMessage(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setTopic(predefinedTopics[0] || 'General');
    setQuestionType('single_choice');
    setMarks(1);
    setNegativeMarks(0);
    setExplanation('');
    setOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    setSingleCorrectIndex(0);
    setMultiCorrectIndices([0]);
    setTypingAcceptedAnswers('Answer keyword 1, Answer keyword 2');
    setErrorMessage(null);
    setShowAddModal(true);
  };

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

  // Save (Create or Update)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    try {
      setLoading(true);
      setErrorMessage(null);

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

      if (editingQuestion) {
        // UPDATE existing question
        const res = await fetch('/api/admin/questions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingQuestion.id,
            questionText: questionText.trim(),
            questionType,
            topic: topic.trim() || 'General',
            options: finalOptions,
            correctAnswers: correctAnswersToSave,
            marks: Number(marks) || 1,
            negativeMarks: Number(negativeMarks) || 0,
            explanation: explanation.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update question');
        setEditingQuestion(null);
      } else {
        // CREATE new question
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paperId: selectedPaperId,
            questionText: questionText.trim(),
            questionType,
            topic: topic.trim() || 'General',
            options: finalOptions,
            correctAnswers: correctAnswersToSave,
            marks: Number(marks) || 1,
            negativeMarks: Number(negativeMarks) || 0,
            explanation: explanation.trim(),
            orderIndex: questions.length + 1,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add question');
        setShowAddModal(false);
      }

      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/questions?id=${qId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete question');
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
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Predefined Topics Management Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Predefined Assessment Topics
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add topic (e.g. Mechanical, Physics, Maths)..."
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewTopic();
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 w-52 sm:w-64"
            />
            <button
              type="button"
              onClick={handleAddNewTopic}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Topic</span>
            </button>
          </div>
        </div>

        {/* Topic Pills List */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {predefinedTopics.map((top) => (
            <span
              key={top}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
            >
              <span>{top}</span>
              <button
                type="button"
                onClick={(e) => handleDeleteTopic(top, e)}
                className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                title={`Remove ${top} from predefined list`}
              >
                &times;
              </button>
            </span>
          ))}

          {predefinedTopics.length === 0 && (
            <span className="text-xs text-slate-400 italic">
              No predefined topics yet. Add your custom topics above.
            </span>
          )}
        </div>
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

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                  +{q.marks} Mark{q.marks > 1 ? 's' : ''}
                </span>
                {q.negative_marks > 0 && (
                  <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-lg">
                    -{q.negative_marks} Neg
                  </span>
                )}

                {/* Edit Button */}
                <button
                  onClick={() => handleOpenEdit(q)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer"
                  title="Edit Question"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete Question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-slate-900">Required Keywords / Accepted Phrases:</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                      Smart Keyword Matching
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(q.correct_answers || []).map((ans, aIdx) => (
                      <span
                        key={aIdx}
                        className="inline-block bg-white border border-emerald-300 text-emerald-800 px-2.5 py-0.5 rounded-md font-mono text-[11px]"
                      >
                        &quot;{ans}&quot;
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1.5">
                    💡 If a student writes a full sentence containing these concepts (e.g. &quot;...{q.correct_answers?.[0]}...&quot;), the system automatically validates and awards the marks!
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

      {/* Add / Edit Question Modal */}
      {(showAddModal || editingQuestion) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="font-bold text-slate-900 text-base">
                {editingQuestion ? 'Edit Assessment Question' : 'Create Assessment Question'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingQuestion(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs md:text-sm">
              {/* Question Text */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Question Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the full question text here (e.g. What is digital and analog?)..."
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
                      <div className="text-[10px] text-slate-500 font-normal">Keyword evaluation</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topic Selection with Custom Predefined Manager */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Topic / Category <span className="text-slate-400 font-normal">(Used for graph analytics)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewTopicBox(!showNewTopicBox)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showNewTopicBox ? 'Cancel' : '+ Add Custom Topic'}
                  </button>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Select from below or type custom topic..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 mb-2 font-medium"
                />

                {/* Inline Add Topic Box */}
                {showNewTopicBox && (
                  <div className="flex items-center gap-2 p-2.5 mb-2 bg-indigo-50/70 border border-indigo-200 rounded-xl animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Enter new topic name (e.g. Mechanical, Physics, Accounts)..."
                      value={newTopicInput}
                      onChange={(e) => setNewTopicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewTopic();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewTopic}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-2xs"
                    >
                      Save Topic
                    </button>
                  </div>
                )}

                {/* Clickable Predefined Topic Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {predefinedTopics.map((top) => (
                    <span
                      key={top}
                      onClick={() => setTopic(top)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        topic === top
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{top}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTopic(top, e)}
                        className={`text-xs ml-0.5 hover:text-rose-600 transition-colors cursor-pointer ${
                          topic === top ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                        title={`Remove ${top} from list`}
                      >
                        &times;
                      </button>
                    </span>
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-800 text-xs block">
                        Required Keywords or Key Phrases (comma-separated):
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. discrete, continuous OR signals, transmitted"
                      value={typingAcceptedAnswers}
                      onChange={(e) => setTypingAcceptedAnswers(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-mono"
                    />
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1">
                      <p className="font-semibold text-indigo-900 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-indigo-600" />
                        How does grading evaluate this?
                      </p>
                      <p>
                        • <strong>You don&apos;t need to write a whole paragraph</strong> — just write the core <strong>keywords</strong> or <strong>phrases</strong>.
                      </p>
                      <p>
                        • If a student writes a descriptive answer containing these keywords (e.g., student writes: <em>&quot;Digital signals are discrete and analog are continuous...&quot;</em>), the system detects the keywords and awards the marks!
                      </p>
                    </div>
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
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Saving...' : editingQuestion ? 'Save Changes' : 'Save Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
