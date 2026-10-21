'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Paper, Question, FormField } from '@/types/database';
import RegistrationForm from '@/components/student/RegistrationForm';
import ExamInterface from '@/components/student/ExamInterface';
import ResultScreen from '@/components/student/ResultScreen';
import { Loader2, AlertCircle } from 'lucide-react';

function AssessmentApp() {
  const searchParams = useSearchParams();
  const directPaperId = searchParams.get('paperId') || searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [error, setError] = useState<string | null>(null);

  // App step: 'register' | 'exam' | 'result'
  const [step, setStep] = useState<'register' | 'exam' | 'result'>('register');
  const [studentData, setStudentData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    async function loadAssessment() {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from('papers').select('*');
        if (directPaperId) {
          query = query.eq('id', directPaperId);
        } else {
          query = query.eq('is_active', true);
        }

        const { data: papers, error: pError } = await query.limit(1);

        if (pError) throw pError;

        if (!papers || papers.length === 0) {
          setError(
            directPaperId
              ? 'The requested question paper was not found.'
              : 'No test is currently active. Please check back soon or contact the institute administrator.'
          );
          setLoading(false);
          return;
        }

        const activePaper = papers[0];
        setPaper(activePaper);

        // Fetch form fields
        const { data: fields, error: fError } = await supabase
          .from('form_fields')
          .select('*')
          .eq('paper_id', activePaper.id)
          .order('order_index', { ascending: true });

        if (fError) throw fError;
        setFormFields(fields || []);

        // Fetch questions securely without exposing correct_answers and explanation
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('id, paper_id, question_text, question_type, topic, options, marks, negative_marks, order_index')
          .eq('paper_id', activePaper.id)
          .order('order_index', { ascending: true });

        if (qError) throw qError;
        setQuestions((qData || []) as Question[]);
      } catch (err: any) {
        console.error('Error fetching paper:', err);
        setError(err.message || 'Failed to load test paper. Please verify your connection.');
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [directPaperId]);

  const handleStartExam = (data: Record<string, string>) => {
    setStudentData(data);
    setStep('exam');
  };

  const handleSubmitExam = async (
    answers: Record<string, any>,
    tabSwitches: number,
    timeTakenSeconds: number
  ) => {
    if (!paper) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: paper.id,
          studentData,
          answers,
          tabSwitchCount: tabSwitches,
          timeTakenSeconds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit test');
      }

      setSubmissionResult(data.result);
      setStep('result');
    } catch (err: any) {
      alert('Error during submission: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
        <p className="text-slate-600 font-medium text-sm">Loading assessment environment...</p>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Notice</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header bar only during Registration and Result */}
      {step !== 'exam' && (
        <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                A5
              </div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                Assessment Portal
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Dynamic Step Content */}
      <div className="flex-1">
        {step === 'register' && (
          <RegistrationForm
            title={paper.title}
            description={paper.description}
            durationMinutes={paper.duration_minutes}
            questionCount={questions.length}
            formFields={formFields}
            onStart={handleStartExam}
          />
        )}

        {step === 'exam' && (
          <ExamInterface
            paper={paper}
            questions={questions}
            studentData={studentData}
            onSubmit={handleSubmitExam}
            isSubmitting={isSubmitting}
          />
        )}

        {step === 'result' && (
          <ResultScreen
            paperTitle={paper.title}
            studentName={
              studentData.full_name ||
              studentData.name ||
              Object.values(studentData)[0] ||
              'Student'
            }
            showResultsImmediately={paper.show_results_immediately}
            result={submissionResult}
            onReset={() => {
              setStep('register');
              setStudentData({});
              setSubmissionResult(null);
            }}
          />
        )}
      </div>

      {/* Footer bar */}
      {step !== 'exam' && (
        <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} A5 Assessment Platform. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <AssessmentApp />
    </Suspense>
  );
}
