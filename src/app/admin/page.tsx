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
        // default to active paper or first
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
        <p>A5 Assessment Administrator Control • Connected to Supabase Project: rfpdqxjxnceyfmzzapkq</p>
      </footer>
    </div>
  );
}
