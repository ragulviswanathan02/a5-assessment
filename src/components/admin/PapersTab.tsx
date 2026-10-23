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
  Award,
  Pencil,
  Settings2,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  papers: Paper[];
  onRefresh: () => void;
  onSelectPaper: (id: string) => void;
}

// Helper to safely parse numeric settings without resetting 0 to fallback
function parseNum(val: any, fallback: number): number {
  if (val === undefined || val === null || val === '') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

// Helper to extract certificate config from paper
function getPaperCert(p: Paper) {
  let cert = {
    enabled: !!p.certificate_enabled,
    minMarks: parseNum(p.certificate_min_marks, 10),
    minPercentage: parseNum(p.certificate_min_percentage, 0),
    title: p.certificate_title || p.title || 'Industrial Automation Skill Training Program',
    signatory: p.certificate_signatory || 'Director',
    signatoryTitle: p.certificate_signatory_title || 'A5 Automation',
  };

  if (p.description && p.description.includes('[CERT_CFG:')) {
    try {
      const match = p.description.match(/\[CERT_CFG:(.*?)\]/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (parsed.enabled !== undefined) cert.enabled = !!parsed.enabled;
        if (parsed.minMarks !== undefined && parsed.minMarks !== null) cert.minMarks = parseNum(parsed.minMarks, cert.minMarks);
        if (parsed.minPercentage !== undefined && parsed.minPercentage !== null) cert.minPercentage = parseNum(parsed.minPercentage, 0);
        if (parsed.title) cert.title = parsed.title;
        if (parsed.signatory) cert.signatory = parsed.signatory;
        if (parsed.signatoryTitle) cert.signatoryTitle = parsed.signatoryTitle;
      }
    } catch (e) {}
  }
  return cert;
}

export default function PapersTab({ papers, onRefresh, onSelectPaper }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Paper Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [showResultsImmediately, setShowResultsImmediately] = useState(true);
  const [trackTabSwitches, setTrackTabSwitches] = useState(true);

  // Certificate Form State
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [certificateMinMarks, setCertificateMinMarks] = useState<number | string>(10);
  const [certificateMinPercentage, setCertificateMinPercentage] = useState<number | string>(0);
  const [certificateTitle, setCertificateTitle] = useState('');
  const [certificateSignatory, setCertificateSignatory] = useState('Director');
  const [certificateSignatoryTitle, setCertificateSignatoryTitle] = useState('A5 Automation');

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPaper(null);
    setTitle('');
    setDescription('');
    setDurationMinutes(30);
    setShowResultsImmediately(true);
    setTrackTabSwitches(true);
    setCertificateEnabled(false);
    setCertificateMinMarks(10);
    setCertificateMinPercentage(0);
    setCertificateTitle('');
    setCertificateSignatory('Director');
    setCertificateSignatoryTitle('A5 Automation');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Paper) => {
    setEditingPaper(p);
    setTitle(p.title);
    setDescription((p.description || '').replace(/\[CERT_CFG:[\s\S]*?\]/, '').trim());
    setDurationMinutes(p.duration_minutes ?? 30);
    setShowResultsImmediately(p.show_results_immediately ?? true);
    setTrackTabSwitches(p.track_tab_switches ?? true);

    const c = getPaperCert(p);
    setCertificateEnabled(c.enabled);
    setCertificateMinMarks(c.minMarks);
    setCertificateMinPercentage(c.minPercentage);
    setCertificateTitle(c.title);
    setCertificateSignatory(c.signatory);
    setCertificateSignatoryTitle(c.signatoryTitle);

    setShowCreateModal(true);
  };

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

  // Save Paper (Create or Update)
  const handleSavePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoadingAction(true);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes) || 0,
        showResultsImmediately,
        trackTabSwitches,
        certificateEnabled,
        certificateMinMarks: certificateMinMarks !== '' ? Math.max(0, Number(certificateMinMarks)) : 10,
        certificateMinPercentage: certificateMinPercentage !== '' ? Math.max(0, Number(certificateMinPercentage)) : 0,
        certificateTitle: certificateTitle.trim() || title.trim(),
        certificateSignatory: certificateSignatory.trim() || 'Director',
        certificateSignatoryTitle: certificateSignatoryTitle.trim() || 'A5 Automation',
      };

      if (editingPaper) {
        // UPDATE
        const res = await fetch('/api/admin/papers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPaper.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update paper');
      } else {
        // CREATE
        const isFirst = papers.length === 0;
        const res = await fetch('/api/admin/papers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, isActive: isFirst }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create paper');

        if (data.data?.id) {
          onSelectPaper(data.data.id);
        }
      }

      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      alert('Failed to save paper: ' + err.message);
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
            Create assessment papers, set the live test, configure certificates, or copy links for your website.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
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
          const cert = getPaperCert(paper);
          const cleanDesc = (paper.description || '').replace(/\[CERT_CFG:[\s\S]*?\]/, '').trim();

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

                  <div className="flex items-center gap-2">
                    {cert.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>≥ {cert.minPercentage > 0 ? `${cert.minPercentage}%` : `${cert.minMarks}m`}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">No Cert</span>
                    )}

                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {paper.duration_minutes > 0 ? `${paper.duration_minutes}m` : 'Untimed'}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-1">
                  {paper.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {cleanDesc || 'No description provided.'}
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
                <button
                  onClick={() => handleOpenEdit(paper)}
                  className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Edit Paper & Certificate Settings"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                {!paper.is_active ? (
                  <button
                    onClick={() => handleSetActive(paper.id)}
                    disabled={loadingAction}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all cursor-pointer text-center"
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

      {/* Create / Edit Paper Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingPaper ? 'Edit Paper & Certificate Settings' : 'Create New Question Paper'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePaper} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Paper Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Automation Skills Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={2}
                  placeholder="Instructions shown to candidates before starting..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duration (Minutes) <span className="text-slate-400 font-normal">(0 for unlimited)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="pt-2 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={showResultsImmediately}
                      onChange={(e) => setShowResultsImmediately(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span className="text-slate-700 font-medium">Show immediate score</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={trackTabSwitches}
                      onChange={(e) => setTrackTabSwitches(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span className="text-slate-700 font-medium">Track anti-cheat tab switches</span>
                  </label>
                </div>
              </div>

              {/* ================= CERTIFICATE SETTINGS CARD ================= */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-yellow-500/5 border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs md:text-sm">
                        Certificate of Qualification
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Award official A5 Automation Training Academy credentials
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certificateEnabled}
                      onChange={(e) => setCertificateEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </div>

                {certificateEnabled && (
                  <div className="space-y-3 pt-3 border-t border-amber-200/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Minimum Marks Cutoff (e.g. 10)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={certificateMinMarks}
                          onChange={(e) => setCertificateMinMarks(e.target.value)}
                          placeholder="10"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-amber-200"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Marks threshold (e.g. 10). Set to 0 if not used.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Minimum Percentage Cutoff (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={certificateMinPercentage}
                          onChange={(e) => setCertificateMinPercentage(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-amber-200"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Percentage threshold (e.g. 60%). Set to 0 to disable.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Certificate Program / Training Course Title
                      </label>
                      <input
                        type="text"
                        value={certificateTitle}
                        onChange={(e) => setCertificateTitle(e.target.value)}
                        placeholder={title || 'Industrial Automation Skill Training Program'}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-amber-200"
                      />
                    </div>



                    <div className="bg-amber-100/60 p-2.5 rounded-lg text-[11px] text-amber-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        {Number(certificateMinMarks) > 0 && Number(certificateMinPercentage) > 0
                          ? `Students who score ≥ ${certificateMinMarks} marks OR ≥ ${certificateMinPercentage}% can view and download their verified certificate.`
                          : Number(certificateMinMarks) > 0
                          ? `Students who score ≥ ${certificateMinMarks} marks can view and download their verified certificate.`
                          : Number(certificateMinPercentage) > 0
                          ? `Students who score ≥ ${certificateMinPercentage}% can view and download their verified certificate.`
                          : `All students completing the assessment will receive their verified certificate.`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs shadow-xs"
                >
                  {loadingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loadingAction ? 'Saving...' : editingPaper ? 'Save Changes' : 'Create Paper'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
