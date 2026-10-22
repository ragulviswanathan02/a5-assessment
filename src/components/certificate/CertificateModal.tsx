'use client';

import React, { useRef } from 'react';
import { X, Printer, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface CertificateData {
  id?: string;
  studentName: string;
  studentCollege?: string;
  paperTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  cutoffPercentage?: number;
  cutoffMarks?: number;
  issueDate?: string;
}

interface Props {
  data: CertificateData;
  onClose: () => void;
}

export default function CertificateModal({ data, onClose }: Props) {
  const certificateRef = useRef<HTMLDivElement>(null);

  // Format date as DD/MM/YYYY to match academy template (e.g. 23/10/2026)
  const dateObj = data.issueDate ? new Date(data.issueDate) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  const certId =
    data.id ||
    'A5A-' + year + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  const qualifyingScoreText =
    data.cutoffPercentage && data.cutoffPercentage > 0
      ? `${data.cutoffPercentage}%`
      : data.cutoffMarks && data.cutoffMarks > 0
      ? `${data.cutoffMarks} Marks`
      : '70%';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Import Academy Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@600;700;800;900&family=Montserrat:wght@400;500;600;700;800&display=swap"
      />

      {/* Container Card */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        {/* Header Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-tight">Official Academy Certificate</span>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-emerald-500/30 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" /> ID: {certId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 bg-slate-200/70 flex items-center justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* ================= ACTUAL PRINTABLE CERTIFICATE ================= */}
          <div
            id="printable-certificate"
            ref={certificateRef}
            className="w-full max-w-[1024px] aspect-[1.414/1] bg-white text-[#0c2340] relative flex flex-col justify-between shadow-2xl print:shadow-none overflow-hidden select-none"
            style={{
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {/* 1. Geometric Navy & Gold Corner Facets */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/corner-tl-clean.png"
              alt="Corner Top Left"
              className="absolute top-0 left-0 w-32 sm:w-44 h-auto pointer-events-none z-10 select-none"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/corner-tr-clean.png"
              alt="Corner Top Right"
              className="absolute top-0 right-0 w-32 sm:w-44 h-auto pointer-events-none z-10 select-none"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/corner-bl-clean.png"
              alt="Corner Bottom Left"
              className="absolute bottom-0 left-0 w-32 sm:w-44 h-auto pointer-events-none z-10 select-none"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/corner-br-clean.png"
              alt="Corner Bottom Right"
              className="absolute bottom-0 right-0 w-32 sm:w-44 h-auto pointer-events-none z-10 select-none"
            />

            {/* Inset Gold Hairline Framing */}
            <div className="absolute inset-4 sm:inset-5 border-[1.5px] border-[#d4af37] pointer-events-none z-5" />
            <div className="absolute inset-5 sm:inset-6 border border-[#d4af37]/35 pointer-events-none z-5" />

            {/* Content Container */}
            <div className="relative z-20 h-full flex flex-col items-center justify-between text-center px-8 sm:px-16 pt-7 sm:pt-9 pb-5 sm:pb-7">
              {/* TOP BRANDING & LOGO */}
              <div className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/a5a-academy-logo.png"
                  alt="A5 Automation Training Academy"
                  className="h-14 sm:h-20 object-contain mb-1.5"
                />

                <div
                  className="text-[12px] sm:text-[14px] font-bold tracking-[0.25em] text-[#0c2340] uppercase mt-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  CERTIFICATE OF
                </div>
                <h1
                  className="text-lg sm:text-2xl md:text-3xl font-black tracking-[0.12em] text-[#0c2340] uppercase leading-tight mt-0.5"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {data.paperTitle
                    ? data.paperTitle.toUpperCase()
                    : 'INDUSTRIAL AUTOMATION APTITUDE'}
                </h1>
              </div>

              {/* BODY: RECIPIENT & QUALIFICATION DETAILS */}
              <div className="my-auto w-full max-w-2xl flex flex-col items-center py-1">
                <p className="text-xs sm:text-sm font-medium text-[#1e293b] mb-1">
                  This is to certify that
                </p>

                {/* Candidate Name in Alex Brush Script */}
                <h2
                  className="text-3xl sm:text-5xl md:text-[54px] text-[#0b2545] font-normal leading-tight tracking-wide my-0.5"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                >
                  {data.studentName || 'Student Full Name'}
                </h2>

                {/* Golden Gradient Underline Accent */}
                <div className="w-64 sm:w-80 md:w-96 h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mb-2 sm:mb-2.5" />

                {/* Candidate College */}
                <p className="text-xs sm:text-sm md:text-[15px] font-bold text-[#0c2340] mb-0.5">
                  of {data.studentCollege || 'Hindustan College of Technology, Salem'}
                </p>

                <p className="text-[11px] sm:text-xs text-[#334155] mb-0.5">
                  has successfully qualified in the
                </p>

                {/* Assessment Topic Line */}
                <h3 className="text-xs sm:text-base font-extrabold text-[#0c2340] mb-2">
                  {data.paperTitle || 'Industrial Automation Aptitude'} Assessment
                </h3>

                {/* Score & Cutoff Pill Badge */}
                <div className="inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-1 sm:py-1.5 rounded-full bg-[#f8fafc] border border-slate-300 text-[11px] sm:text-xs font-bold text-[#0c2340] shadow-2xs mb-2">
                  <span>
                    Assessment Score:{' '}
                    <strong className="text-[#0284c7]">
                      {Math.round(data.percentage)}%
                    </strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Minimum Qualifying Score:{' '}
                    <strong className="text-[#0c2340]">{qualifyingScoreText}</strong>
                  </span>
                </div>

                {/* Disclaimer / Accreditation Clause */}
                <p className="text-[9px] sm:text-[10px] text-[#64748b] max-w-xl mx-auto leading-relaxed text-center px-4">
                  This certificate recognizes technical aptitude and eligibility for the A5A Automation Training Academy course admission benefit. It does not represent completion of the full training program.
                </p>
              </div>

              {/* FOOTER: CREDENTIAL ID + CENTRAL LAUREL MEDALLION + DATE */}
              <div className="w-full flex items-end justify-between px-3 sm:px-6 pt-1">
                {/* Left: Credential ID */}
                <div className="text-left">
                  <p className="text-[9px] sm:text-[10px] font-bold text-[#0c2340] uppercase tracking-wider">
                    Credential ID:
                  </p>
                  <p className="text-[10px] sm:text-xs font-mono font-bold text-[#475569]">
                    {certId}
                  </p>
                  <p className="text-[8px] sm:text-[9px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 inline" /> Verified Academy Record
                  </p>
                </div>

                {/* Center: Golden Laurel Wreath Medallion Seal */}
                <div className="flex flex-col items-center -mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/a5a-laurel-seal.png"
                    alt="A5A Official Laurel Seal"
                    className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-sm select-none"
                  />
                </div>

                {/* Right: Date of Assessment */}
                <div className="text-right">
                  <p className="text-[11px] sm:text-xs font-semibold text-[#0c2340]">
                    Date of Assessment: <strong className="font-bold">{formattedDate}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS for Print Optimization */}
      <style jsx global>{`
        @page {
          size: landscape;
          margin: 0;
        }
        @media print {
          html,
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-certificate,
          #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
