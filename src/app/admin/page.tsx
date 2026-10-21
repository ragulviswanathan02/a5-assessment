'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Paper, Question, FormField, Submission } from '@/types/database';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import PapersTab from '@/components/admin/PapersTab';
import FormBuilderTab from '@/components/admin/FormBuilderTab';
import QuestionsTab from '@/components/admin/QuestionsTab';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  HelpCircle,
  LogOut,
  ExternalLink,
  Shield,
  Loader2,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'papers' | 'form' | 'questions'>('analytics');

  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Security Credentials Modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newUsername, setNewUsername] = useState('admin');
  const [newPassword, setNewPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [credMsg, setCredMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // 1. Check Admin Auth
  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch('/api/admin/check-auth');
        if (!res.ok) {
          router.replace('/admin/login');
          return;
        }
        setCheckingAuth(false);
      } catch (e) {
        router.replace('/admin/login');
      }
    }
    verifyAuth();
  }, [router]);

  // 2. Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);

      // Fetch all papers
      const { data: pList, error: pError } = await supabase
        .from('papers')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError) throw pError;
      setPapers(pList || []);

      let currentId = selectedPaperId;
      if (!currentId && pList && pList.length > 0) {
        const active = pList.find((p) => p.is_active) || pList[0];
        currentId = active.id;
        setSelectedPaperId(currentId);
      }

      if (currentId) {
        // Fetch fields
        const { data: fields } = await supabase
          .from('form_fields')
          .select('*')
          .eq('paper_id', currentId)
          .order('order_index', { ascending: true });
        setFormFields(fields || []);

        // Fetch questions
        const { data: qData } = await supabase
          .from('questions')
          .select('*')
          .eq('paper_id', currentId)
          .order('order_index', { ascending: true });
        setQuestions((qData || []) as Question[]);
      }

      // Fetch all submissions
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      setSubmissions((subs || []) as Submission[]);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [selectedPaperId]);

  useEffect(() => {
    if (!checkingAuth) {
      fetchData();
    }
  }, [checkingAuth, fetchData]);

  // Refresh sub-data when paper selector changes
  const handleSelectPaper = async (paperId: string) => {
    setSelectedPaperId(paperId);
    try {
      const { data: fields } = await supabase
        .from('form_fields')
        .select('*')
        .eq('paper_id', paperId)
        .order('order_index', { ascending: true });
      setFormFields(fields || []);

      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('paper_id', paperId)
        .order('order_index', { ascending: true });
      setQuestions((qData || []) as Question[]);
    } catch (e) {
      console.error(e);
    }
  };

  // Change Admin Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setCredMsg({ text: 'Password must be at least 4 characters.', isError: true });
      return;
    }

    try {
      setCredLoading(true);
      setCredMsg(null);
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update credentials');

      setCredMsg({ text: 'Credentials updated successfully in database!', isError: false });
      setTimeout(() => {
        setShowAccountModal(false);
        setCredMsg(null);
        setNewPassword('');
      }, 1500);
    } catch (err: any) {
      setCredMsg({ text: err.message || 'Error updating password', isError: true });
    } finally {
      setCredLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Admin Console</h1>
              <p className="text-xs text-slate-500">Assessment & Registration Control Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={fetchData}
              disabled={loadingData}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>

            {/* Change Admin Password Button */}
            <button
              onClick={() => {
                setShowAccountModal(true);
                setCredMsg(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-all cursor-pointer"
              title="Change Admin Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Account</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              <span>Open Student Portal</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-100 mt-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Mark Analytics & Results</span>
          </button>

          <button
            onClick={() => setActiveTab('papers')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'papers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Question Papers ({papers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('form')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Form Builder (Google Form Style)</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Questions & Keys ({questions.length})</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        {loadingData && papers.length === 0 ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Connecting to database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'analytics' && (
              <AnalyticsTab
                papers={papers}
                selectedPaperId={selectedPaperId}
                onSelectPaperId={handleSelectPaper}
                submissions={submissions}
              />
            )}

            {activeTab === 'papers' && (
              <PapersTab
                papers={papers}
                onRefresh={fetchData}
                onSelectPaper={handleSelectPaper}
              />
            )}

            {activeTab === 'form' && (
              <FormBuilderTab
                papers={papers}
                selectedPaperId={selectedPaperId}
                onSelectPaperId={handleSelectPaper}
                formFields={formFields}
                onRefresh={fetchData}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionsTab
                papers={papers}
                selectedPaperId={selectedPaperId}
                onSelectPaperId={handleSelectPaper}
                questions={questions}
                onRefresh={fetchData}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} A5 Assessment Management Platform. All rights reserved.</p>
      </footer>

      {/* Admin Account & Password Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                Admin Credentials (Supabase DB)
              </h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {credMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  credMsg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                {credMsg.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{credMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new secret password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This will be saved directly into your Supabase database `admins` table.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={credLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {credLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{credLoading ? 'Saving...' : 'Update in Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
