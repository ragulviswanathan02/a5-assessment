'use client';

import React, { useState } from 'react';
import { Paper } from '@/types/database';
import {
  Plus,
  Copy,
  Check,
  Clock,
  Trash2,
  Loader2,
} from 'lucide-react';

interface Props {
  papers: Paper[];
  onRefresh: () => void;
  onSelectPaper: (id: string) => void;
}

export default function PapersTab({ papers, onRefresh, onSelectPaper }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // New Paper Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [showResultsImmediately, setShowResultsImmediately] = useState(true);
  const [trackTabSwitches, setTrackTabSwitches] = useState(true);

  // Set Paper as Active / Live
  const handleSetActive = async (paperId: string) => {
    try {
      setLoadingAction(true);
      const res = await fetch('/api/admin/papers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set live test');
      onRefresh();
    } catch (err: any) {
      alert('Error updating active paper: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Copy Direct Link for Institute Website Button
  const handleCopyDirectLink = (paperId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const directUrl = `${origin}/test/${paperId}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedId(paperId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Create Paper
  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoadingAction(true);
      const isFirst = papers.length === 0;

      const res = await fetch('/api/admin/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          durationMinutes: Number(durationMinutes) || 0,
          isActive: isFirst,
          showResultsImmediately,
          trackTabSwitches,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create paper');

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      onRefresh();
      if (data.data?.id) {
        onSelectPaper(data.data.id);
      }
    } catch (err: any) {
      alert('Failed to create paper: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete Paper
  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper and all its questions and submissions?')) {
      return;
    }

    try {
      setLoadingAction(true);
      const res = await fetch(`/api/admin/papers?id=${paperId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete paper');
      onRefresh();
    } catch (err: any) {
      alert('Failed to delete paper: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Question Papers Manager</h2>
          <p className="text-xs text-slate-500">
            Create assessment papers, set the live test for students, or copy unique links for your institute website.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Paper</span>
        </button>
      </div>

      {/* Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {papers.map((paper) => {
          const isCopied = copiedId === paper.id;

          return (
            <div
              key={paper.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-all ${
                paper.is_active
                  ? 'border-indigo-600 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Status Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {paper.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE ON ROOT PORTAL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      Draft / Inactive
                    </span>
                  )}

                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {paper.duration_minutes > 0 ? `${paper.duration_minutes}m` : 'Untimed'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-1">
                  {paper.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {paper.description || 'No description provided.'}
                </p>

                {/* Direct Link Box for Institute Website */}
                <div className="bg-slate-50 p-2.5 rounded-xl mb-4 border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Institute Button Link</span>
                    <button
                      onClick={() => handleCopyDirectLink(paper.id)}
                      className="text-indigo-600 font-semibold hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 truncate">
                    /test/{paper.id}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {!paper.is_active ? (
                  <button
                    onClick={() => handleSetActive(paper.id)}
                    disabled={loadingAction}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Set as Live Test
                  </button>
                ) : (
                  <span className="flex-1 py-1.5 text-center text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg">
                    Current Active Paper
                  </span>
                )}

                <button
                  onClick={() => handleDeletePaper(paper.id)}
                  disabled={loadingAction}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete Paper"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Paper Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="font-bold text-slate-900 text-base">Create New Question Paper</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePaper} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Paper Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCS NQT Mock Test 2026 / Python Proficiency"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions to students..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Duration (Minutes) <span className="text-slate-400 font-normal">(0 for unlimited)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showResultsImmediately}
                    onChange={(e) => setShowResultsImmediately(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-slate-700 font-medium">Show score & topic breakdown immediately to student upon submit</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trackTabSwitches}
                    onChange={(e) => setTrackTabSwitches(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-slate-700 font-medium">Track tab switching & anti-cheat warnings</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loadingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loadingAction ? 'Creating...' : 'Create Paper'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
