'use client';

import React, { useRef } from 'react';
import { X, Printer, Download, Award, CheckCircle2, ShieldCheck } from 'lucide-react';

export interface CertificateData {
  id?: string;
  studentName: string;
  studentCollege?: string;
  paperTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  issueDate?: string;
  signatory?: string;
  signatoryTitle?: string;
}

interface Props {
  data: CertificateData;
  onClose: () => void;
}

export default function CertificateModal({ data, onClose }: Props) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formattedDate = data.issueDate
    ? new Date(data.issueDate).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  const certId = data.id || 'A5-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Container Card */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        {/* Header Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-tight">Verified Credential Certificate</span>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-emerald-500/30">
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
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-100 flex items-center justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* ================= ACTUAL PRINTABLE CERTIFICATE ================= */}
          <div
            id="printable-certificate"
            ref={certificateRef}
            className="w-full max-w-[950px] aspect-[1.414/1] bg-[#fdfcf9] text-slate-900 p-6 sm:p-10 relative flex flex-col justify-between shadow-lg print:shadow-none border-[3px] border-[#0f172a] select-none"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              backgroundImage: 'radial-gradient(#e2d9c2 0.75px, transparent 0.75px)',
              backgroundSize: '24px 24px',
            }}
          >
            {/* Inner Decorative Gold Double Border */}
            <div className="absolute inset-2 sm:inset-3 border border-[#c5a059] pointer-events-none" />
            <div className="absolute inset-3 sm:inset-4 border border-[#e5d5b0] pointer-events-none" />

            {/* Corner Decorative Ornaments */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#c5a059]" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#c5a059]" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#c5a059]" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#c5a059]" />

            {/* TOP HEADER: MSME, A5 Logo & Company Name, ISO 9001 */}
            <div className="relative z-10 flex items-center justify-between gap-4 pt-1 border-b border-[#e5d5b0]/60 pb-3">
              {/* Left: MSME Logo */}
              <div className="w-32 sm:w-40 flex items-center justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/msme-logo.svg"
                  alt="MSME Government of India"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div>

              {/* Center: A5 Automation Logo & Name */}
              <div className="text-center flex flex-col items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-[#c5a059] shadow-2xs mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/a5-automation-logo.jpg"
                    alt="A5 Automation Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-lg sm:text-2xl font-bold tracking-[0.2em] text-[#0f172a] uppercase leading-tight font-sans">
                  A5 Automation
                </h1>
                <p className="text-[9px] sm:text-[10px] tracking-[0.25em] text-[#856424] font-semibold uppercase font-sans">
                  Institute of Technical Excellence
                </p>
              </div>

              {/* Right: ISO 9001:2015 Logo */}
              <div className="w-32 sm:w-40 flex items-center justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/iso-logo.svg"
                  alt="ISO 9001:2015 Certified"
                  className="h-12 sm:h-16 w-auto object-contain"
                />
              </div>
            </div>

            {/* CERTIFICATE TITLE */}
            <div className="relative z-10 text-center my-auto py-2">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[0.18em] text-[#0f172a] uppercase font-serif mb-1">
                Certificate
              </h2>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 sm:w-20 h-[1px] bg-[#c5a059]" />
                <p className="text-xs sm:text-sm font-bold tracking-[0.35em] text-[#856424] uppercase">
                  Of Qualification
                </p>
                <div className="w-12 sm:w-20 h-[1px] bg-[#c5a059]" />
              </div>

              {/* RECIPIENT STATEMENT */}
              <p className="text-xs sm:text-sm italic text-[#475569] mb-1">
                This is to certify that
              </p>

              {/* RECIPIENT FULL NAME */}
              <div className="my-2">
                <h3
                  className="text-2xl sm:text-4xl text-[#0f172a] font-normal leading-tight px-4 inline-block pb-1"
                  style={{ fontFamily: "'Brush Script MT', 'Great Vibes', 'Playfair Display', cursive, serif" }}
                >
                  {data.studentName || 'Student Name'}
                </h3>
                <div className="w-72 sm:w-96 mx-auto h-[1.5px] bg-[#c5a059]/70 mt-1" />
              </div>

              {/* RECIPIENT COLLEGE */}
              {data.studentCollege && (
                <p className="text-sm sm:text-base font-semibold tracking-wider text-[#856424] uppercase mt-1 mb-2 font-sans">
                  {data.studentCollege}
                </p>
              )}

              {/* QUALIFICATION DETAIL */}
              <p className="text-xs sm:text-sm text-[#475569] mb-1">
                has successfully qualified with distinction in the assessment of the
              </p>
              <h4 className="text-base sm:text-xl font-bold text-[#0f172a] tracking-wide my-1">
                {data.paperTitle || 'Industrial Automation Skill Training Program'}
              </h4>

              {/* METRIC STRIP */}
              <p className="text-xs sm:text-sm text-[#64748b] tracking-wider mt-2 font-sans">
                Qualified on <strong className="text-[#0f172a]">{formattedDate}</strong> &nbsp;•&nbsp; Score Scored:{' '}
                <strong className="text-[#0f172a]">
                  {data.score} / {data.maxScore} ({Math.round(data.percentage)}%)
                </strong>
              </p>
            </div>

            {/* BOTTOM SECTION: VERIFICATION QR + SEAL + SIGNATURE */}
            <div className="relative z-10 flex items-end justify-between pt-2 border-t border-[#e5d5b0]/60 mt-auto">
              {/* Left: Certificate ID & QR Code */}
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 p-0.5 bg-white border border-[#c5a059] rounded-xs shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/test-qr-code.png"
                    alt="Verification QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left font-sans">
                  <p className="text-[9px] sm:text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">
                    Credential ID
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-[#0f172a] font-mono tracking-wider">
                    {certId}
                  </p>
                  <p className="text-[8px] sm:text-[9px] text-[#856424] flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> Official Digital Record
                  </p>
                </div>
              </div>

              {/* Center: Golden Seal */}
              <div className="flex flex-col items-center pb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/a5-seal.svg"
                  alt="A5 Official Seal"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-xs"
                />
              </div>

              {/* Right: Signature */}
              <div className="text-center w-40 sm:w-48 font-sans">
                <div className="font-serif italic text-lg sm:text-xl text-[#0f172a] border-b border-[#0f172a] pb-1 mb-1 font-bold">
                  {data.signatory || 'Director'}
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-[#0f172a] uppercase tracking-wider">
                  Authorized Signatory
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#64748b] font-medium tracking-wide">
                  {data.signatoryTitle || 'A5 Automation'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS for Print Optimization */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate,
          #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 30px !important;
            box-shadow: none !important;
            border: 4px solid #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
