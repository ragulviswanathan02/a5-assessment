'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, Award, BarChart3, Clock, AlertCircle, Printer, Download, ShieldCheck } from 'lucide-react';
import CertificateModal from '@/components/certificate/CertificateModal';

interface Props {
  paperTitle: string;
  studentName: string;
  studentCollege?: string;
  showResultsImmediately: boolean;
  result?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    topicScores: Record<string, { scored: number; total: number; percentage: number }>;
    certificate?: {
      issued: boolean;
      id?: string;
      studentName?: string;
      studentCollege?: string;
      paperTitle?: string;
      score?: number;
      maxScore?: number;
      percentage?: number;
      issueDate?: string;
      signatory?: string;
      signatoryTitle?: string;
      minMarks?: number;
      minPercentage?: number;
      enabled?: boolean;
    } | null;
  } | null;
  onReset?: () => void;
}

export default function ResultScreen({
  paperTitle,
  studentName,
  studentCollege,
  showResultsImmediately,
  result,
  onReset,
}: Props) {
  const [showCertModal, setShowCertModal] = useState(false);

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

  const certData = result?.certificate;
  const isCertQualified = !!certData && certData.issued;

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

        {/* Certificate Unlocked Golden Card */}
        {isCertQualified && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border-2 border-amber-300 rounded-2xl p-5 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Certificate of Qualification Unlocked!</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
              Congratulations! You have satisfied the qualification criteria for this assessment. Your official credential has been generated.
            </p>
            <button
              onClick={() => setShowCertModal(true)}
              className="mt-3.5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>View &amp; Download Certificate</span>
            </button>
          </div>
        )}

        {/* Not Qualified Notice (if paper had certificate enabled but score below cutoff) */}
        {certData && !certData.issued && certData.enabled && (
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Certificate passing cutoff is <strong>{certData.minMarks} marks</strong> ({certData.minPercentage}%). You scored {result?.totalScore} marks.
            </span>
          </div>
        )}

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

      {/* Certificate Modal */}
      {showCertModal && certData && (
        <CertificateModal
          data={{
            id: certData.id,
            studentName: certData.studentName || studentName,
            studentCollege: certData.studentCollege || studentCollege,
            paperTitle: certData.paperTitle || paperTitle,
            score: certData.score ?? result?.totalScore ?? 0,
            maxScore: certData.maxScore ?? result?.maxScore ?? 0,
            percentage: certData.percentage ?? result?.percentage ?? 0,
            cutoffPercentage: certData.minPercentage,
            cutoffMarks: certData.minMarks,
            issueDate: certData.issueDate,
          }}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
}
