'use client';

import React, { useRef } from 'react';
import { X, Printer, Award } from 'lucide-react';

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

// Helper to convert ALL-CAPS or inconsistent casing to elegant Title Case for cursive script
function formatDisplayName(name: string): string {
  if (!name) return 'Student Full Name';
  return name
    .trim()
    .split(/\s+/)
    .map(part => {
      if (part.length === 1) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

export default function CertificateModal({ data, onClose }: Props) {
  const certRef = useRef<HTMLDivElement>(null);

  const dateObj = data.issueDate ? new Date(data.issueDate) : new Date();
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const formattedDate = `${dd}/${mm}/${yyyy}`;

  const qualifyingText =
    data.cutoffPercentage && data.cutoffPercentage > 0
      ? `${data.cutoffPercentage}%`
      : data.cutoffMarks && data.cutoffMarks > 0
      ? `${data.cutoffMarks} Marks`
      : '70%';

  const titleText = data.paperTitle || 'Industrial Automation Aptitude';
  const collegeText = data.studentCollege || 'Your Institution';
  const displayName = formatDisplayName(data.studentName);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      overflowY: 'auto',
      background: 'rgba(2,6,23,0.88)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>

      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700;800&display=swap"
      />

      {/* Modal shell */}
      <div style={{
        width: '100%', maxWidth: '1080px',
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '95vh',
      }}>

        {/* ── Action bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          background: '#0c2340',
          color: '#fff', flexShrink: 0,
        }} className="print:hidden">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award style={{ width: 16, height: 16, color: '#fbbf24' }} />
            <span style={{ fontWeight: 700, fontSize: '13px', fontFamily: 'Montserrat,sans-serif', letterSpacing: '0.5px' }}>
              Official Academy Certificate
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 16px', borderRadius: '8px',
                background: '#4f46e5', color: '#fff',
                fontSize: '12px', fontWeight: 700,
                border: 'none', cursor: 'pointer', fontFamily: 'Montserrat,sans-serif',
              }}
            >
              <Printer style={{ width: 13, height: 13 }} />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px', borderRadius: '8px',
                background: 'transparent', border: 'none',
                color: '#94a3b8', cursor: 'pointer',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* ── Scroll area ── */}
        <div style={{
          flex: 1, overflowY: 'auto',
          background: '#1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>

          {/* ══════════════════════════════════════════════════════════
              CERTIFICATE: 1024 × 679 px
              Using authentic high-res 3D metallic ribbon artwork base
          ══════════════════════════════════════════════════════════ */}
          <div
            id="printable-certificate"
            ref={certRef}
            style={{
              width: '1024px',
              height: '679px',
              position: 'relative',
              backgroundImage: "url('/a5a-certificate-base.png')",
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              fontFamily: "'Montserrat','Segoe UI',sans-serif",
              color: '#0c2340',
              flexShrink: 0,
              boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
              boxSizing: 'border-box',
            }}
          >
            {/* ── Flowing Content Area (perfectly balanced matching original PDF) ── */}
            <div style={{
              position: 'absolute',
              top: '168px',
              left: '120px',
              right: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}>

              {/* Title Section */}
              <p style={{
                fontFamily: "'Cinzel',serif",
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '5px',
                color: '#0c2340',
                textTransform: 'uppercase',
                margin: '0 0 6px',
              }}>
                Certificate of
              </p>
              <h1 style={{
                fontFamily: "'Cinzel',serif",
                fontSize: '26px',
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#0c2340',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                margin: '0 0 24px',
                maxWidth: '680px',
              }}>
                {titleText}
              </h1>

              {/* Recipient & Qualification Details */}
              <p style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1a2b4a',
                margin: '0 0 2px',
              }}>
                This is to certify that
              </p>

              {/* Student Name */}
              <div style={{
                fontFamily: "'Alex Brush',cursive",
                fontSize: '52px',
                fontWeight: 400,
                color: '#0c2340',
                lineHeight: 1.05,
                margin: '0 0 2px',
                letterSpacing: '1px',
              }}>
                {displayName}
              </div>

              {/* Refined Gold Underline */}
              <div style={{
                width: '440px',
                maxWidth: '70%',
                height: '1.5px',
                background: 'linear-gradient(90deg, transparent 0%, #c8a84b 20%, #e5c365 50%, #c8a84b 80%, transparent 100%)',
                margin: '4px auto 10px',
              }} />

              <p style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#0c2340',
                margin: '0 0 3px',
              }}>
                of {collegeText}
              </p>

              <p style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#334155',
                margin: '0 0 3px',
              }}>
                has successfully qualified in the
              </p>

              <h3 style={{
                fontSize: '16.5px',
                fontWeight: 800,
                color: '#0c2340',
                letterSpacing: '0.3px',
                margin: '0 0 14px',
              }}>
                {titleText} Assessment
              </h3>

              {/* Score & Qualifying criteria — bold, sharp, high contrast */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#0c2340',
                margin: '0 0 14px',
                letterSpacing: '0.2px',
              }}>
                <span>
                  Assessment Score:{' '}
                  <strong style={{ color: '#0284c7', fontWeight: 800 }}>
                    {Math.round(data.percentage)}%
                  </strong>
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '15px' }}>|</span>
                <span>
                  Minimum Qualifying Score:{' '}
                  <strong style={{ color: '#0c2340', fontWeight: 800 }}>{qualifyingText}</strong>
                </span>
              </div>

              {/* Academy Disclaimer — sharp, readable dark slate, no dullness */}
              <p style={{
                fontSize: '10.5px',
                fontWeight: 500,
                color: '#1e293b',
                lineHeight: 1.55,
                maxWidth: '560px',
                margin: '0 auto',
                letterSpacing: '0.1px',
              }}>
                This certificate recognizes technical aptitude and eligibility for the A5A Automation Training Academy course admission benefit.{' '}
                It does not represent completion of the full training program.
              </p>

            </div>

            {/* Date positioned directly under the gold line on the right */}
            <p style={{
              position: 'absolute',
              top: '585px',
              left: '576px',
              width: '232px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: '#1e293b',
              margin: 0,
              letterSpacing: '0.2px',
            }}>
              Date of Assessment: <strong style={{ color: '#0c2340', fontWeight: 800 }}>{formattedDate}</strong>
            </p>

          </div>{/* end certificate */}
        </div>{/* end scroll area */}
      </div>{/* end modal shell */}

      <style jsx global>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          #printable-certificate,
          #printable-certificate * { visibility: visible !important; }
          #printable-certificate {
            position: fixed !important; inset: 0 !important;
            width: 100vw !important; height: 100vh !important;
            margin: 0 !important; padding: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
