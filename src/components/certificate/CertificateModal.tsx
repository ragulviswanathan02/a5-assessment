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

  const dateObj = data.issueDate ? new Date(data.issueDate) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  const certId =
    data.id ||
    'A5A-' + year + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const qualifyingText =
    data.cutoffPercentage && data.cutoffPercentage > 0
      ? `${data.cutoffPercentage}%`
      : data.cutoffMarks && data.cutoffMarks > 0
      ? `${data.cutoffMarks} Marks`
      : '70%';

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 print:p-0 print:bg-white print:fixed print:inset-0">

      {/* Container Card */}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">

        {/* ── Action Bar (hidden in print) ── */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm">Official Academy Certificate</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {certId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Preview Scroll Area ── */}
        <div className="flex-1 overflow-auto bg-slate-300/60 p-4 sm:p-8 flex items-start justify-center print:p-0 print:bg-white">

          {/* ──────────────────────────────────────────
              PRINTABLE CERTIFICATE
              Fixed aspect ratio, all content in safe zone.
              Corners are purely decorative, small and non-overlapping.
          ────────────────────────────────────────── */}
          <div
            id="printable-certificate"
            ref={certificateRef}
            style={{
              width: '900px',
              minHeight: '636px',
              position: 'relative',
              background: '#ffffff',
              fontFamily: "'Montserrat', 'Segoe UI', sans-serif",
              color: '#0c2340',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* ── Outer gold border ── */}
            <div style={{
              position: 'absolute', inset: '0', border: '3px solid #d4af37', pointerEvents: 'none', zIndex: 2,
            }} />
            {/* ── Inner thin border ── */}
            <div style={{
              position: 'absolute', inset: '10px', border: '1px solid rgba(212,175,55,0.4)', pointerEvents: 'none', zIndex: 2,
            }} />

            {/* ── CORNER IMAGES (small, tucked into corners, behind content safe zone) ── */}
            {/* Top-Left */}
            <img src="/corner-tl-clean.png" alt="" aria-hidden="true"
              style={{ position: 'absolute', top: 0, left: 0, width: '140px', height: '140px', objectFit: 'cover', objectPosition: 'top left', pointerEvents: 'none', zIndex: 1 }} />
            {/* Top-Right */}
            <img src="/corner-tr-clean.png" alt="" aria-hidden="true"
              style={{ position: 'absolute', top: 0, right: 0, width: '140px', height: '140px', objectFit: 'cover', objectPosition: 'top right', pointerEvents: 'none', zIndex: 1 }} />
            {/* Bottom-Left */}
            <img src="/corner-bl-clean.png" alt="" aria-hidden="true"
              style={{ position: 'absolute', bottom: 0, left: 0, width: '140px', height: '140px', objectFit: 'cover', objectPosition: 'bottom left', pointerEvents: 'none', zIndex: 1 }} />
            {/* Bottom-Right */}
            <img src="/corner-br-clean.png" alt="" aria-hidden="true"
              style={{ position: 'absolute', bottom: 0, right: 0, width: '140px', height: '140px', objectFit: 'cover', objectPosition: 'bottom right', pointerEvents: 'none', zIndex: 1 }} />

            {/* ────────────────────────────────────────
                CONTENT BLOCK — padded safely inside corners
            ──────────────────────────────────────── */}
            <div style={{
              position: 'relative',
              zIndex: 10,
              padding: '32px 120px 28px',   /* left/right 120px clears the 140px corners safely */
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0',
            }}>

              {/* ── 1. ACADEMY LOGO ── */}
              <div style={{ marginBottom: '10px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/a5a-academy-logo.png"
                  alt="A5 Automation Training Academy"
                  style={{ height: '68px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
              </div>

              {/* ── 2. CERTIFICATE OF / TITLE ── */}
              <div style={{ marginBottom: '14px' }}>
                <p style={{
                  fontFamily: "'Cinzel', 'Times New Roman', serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '4px',
                  color: '#0c2340',
                  textTransform: 'uppercase',
                  margin: '0 0 4px',
                }}>
                  Certificate of
                </p>
                <h1 style={{
                  fontFamily: "'Cinzel', 'Times New Roman', serif",
                  fontSize: '24px',
                  fontWeight: 900,
                  letterSpacing: '3px',
                  color: '#0c2340',
                  textTransform: 'uppercase',
                  lineHeight: 1.25,
                  margin: 0,
                }}>
                  {data.paperTitle
                    ? data.paperTitle.length > 40
                      ? data.paperTitle
                      : data.paperTitle
                    : 'Industrial Automation Aptitude'}
                </h1>
              </div>

              {/* ── 3. CERTIFY TEXT ── */}
              <p style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#334155',
                margin: '0 0 6px',
                letterSpacing: '0.5px',
              }}>
                This is to certify that
              </p>

              {/* ── 4. STUDENT NAME ── */}
              <h2 style={{
                fontFamily: "'Alex Brush', 'Dancing Script', cursive",
                fontSize: '52px',
                color: '#0b2545',
                fontWeight: 400,
                lineHeight: 1.1,
                margin: '0 0 2px',
                letterSpacing: '1px',
              }}>
                {data.studentName || 'Student Full Name'}
              </h2>

              {/* ── Gold underline ── */}
              <div style={{
                width: '320px',
                height: '1.5px',
                background: 'linear-gradient(90deg, transparent 0%, #d4af37 30%, #f9df7b 50%, #d4af37 70%, transparent 100%)',
                margin: '6px auto 14px',
              }} />

              {/* ── 5. COLLEGE ── */}
              <p style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#0c2340',
                margin: '0 0 3px',
              }}>
                of {data.studentCollege || 'Hindustan College of Technology, Salem'}
              </p>

              <p style={{ fontSize: '12px', color: '#334155', margin: '0 0 3px' }}>
                has successfully qualified in the
              </p>

              {/* ── 6. ASSESSMENT NAME ── */}
              <h3 style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#0c2340',
                margin: '0 0 14px',
                letterSpacing: '0.3px',
              }}>
                {(data.paperTitle || 'Industrial Automation Aptitude')} Assessment
              </h3>

              {/* ── 7. SCORE BADGE ── */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                padding: '6px 22px',
                borderRadius: '999px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 700,
                color: '#0c2340',
                marginBottom: '12px',
              }}>
                <span>
                  Assessment Score:{' '}
                  <strong style={{ color: '#0284c7' }}>
                    {Math.round(data.percentage)}%
                  </strong>
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>|</span>
                <span>
                  Minimum Qualifying Score:{' '}
                  <strong>{qualifyingText}</strong>
                </span>
              </div>

              {/* ── 8. DISCLAIMER ── */}
              <p style={{
                fontSize: '9.5px',
                color: '#64748b',
                lineHeight: 1.55,
                maxWidth: '560px',
                margin: '0 auto 22px',
              }}>
                This certificate recognizes technical aptitude and eligibility for the A5A Automation
                Training Academy course admission benefit. It does not represent completion of the full
                training program.
              </p>

              {/* ── 9. FOOTER ROW ── */}
              <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}>
                {/* Left: Credential ID */}
                <div style={{ textAlign: 'left', minWidth: '140px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#0c2340', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>
                    Credential ID:
                  </p>
                  <p style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#475569', margin: '0 0 2px' }}>
                    {certId}
                  </p>
                  <p style={{ fontSize: '8.5px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 style={{ width: '10px', height: '10px', display: 'inline' }} />
                    Verified Academy Record
                  </p>
                </div>

                {/* Center: Laurel Seal */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/a5a-laurel-seal.png"
                    alt="A5A Official Seal"
                    style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
                  />
                </div>

                {/* Right: Date */}
                <div style={{ textAlign: 'right', minWidth: '140px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#0c2340', margin: 0 }}>
                    Date of Assessment:
                  </p>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: '#0c2340', margin: 0 }}>
                    {formattedDate}
                  </p>
                </div>
              </div>

            </div>{/* end content */}
          </div>{/* end certificate */}
        </div>{/* end scroll area */}
      </div>{/* end container */}

      {/* Print styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@600;700;800;900&family=Montserrat:wght@400;500;600;700;800&display=swap');

        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * { visibility: hidden !important; }
          #printable-certificate,
          #printable-certificate * { visibility: visible !important; }
          #printable-certificate {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
