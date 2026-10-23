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
  const qualificationAssessmentTitle =
    titleText.trim().toLowerCase().endsWith('assessment')
      ? titleText.trim()
      : `${titleText.trim()} Assessment`;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/a5-company-logo.png"
              alt="A5 Automation"
              style={{ height: '20px', width: 'auto', objectFit: 'contain' }}
            />
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
            {/* ── Flowing Content Area (balanced vertical rhythm filling the certificate down to the bottom seal) ── */}
            <div style={{
              position: 'absolute',
              top: '46px',
              left: '120px',
              right: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}>

              {/* Official Academy Header Logo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/a5-company-logo.png"
                  alt="A5 Automation"
                  style={{ height: '52px', width: 'auto', objectFit: 'contain', marginBottom: '4px' }}
                />
                <div style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '2.5px',
                  color: '#0c2340',
                  lineHeight: 1.2,
                }}>
                  A5 AUTOMATION
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  margin: '3px 0',
                }}>
                  <div style={{ width: '48px', height: '1.2px', background: '#c8a84b' }} />
                  <span style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '3px',
                    color: '#0c2340',
                  }}>
                    TRAINING ACADEMY
                  </span>
                  <div style={{ width: '48px', height: '1.2px', background: '#c8a84b' }} />
                </div>
                <div style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '8px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  color: '#475569',
                }}>
                  Learn &bull; Build &bull; Advance
                </div>
              </div>

              {/* Title Section */}
              <p style={{
                fontFamily: "'Cinzel',serif",
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '5px',
                color: '#0c2340',
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}>
                Certificate of
              </p>
              <h1 style={{
                fontFamily: "'Cinzel',serif",
                fontSize: '25px',
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#0c2340',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                margin: '0 0 22px',
                maxWidth: '680px',
              }}>
                {titleText}
              </h1>

              {/* Recipient & Qualification Details */}
              <p style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1a2b4a',
                margin: '0 0 4px',
              }}>
                This is to certify that
              </p>

              {/* Student Name */}
              <div style={{
                fontFamily: "'Alex Brush',cursive",
                fontSize: '54px',
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
                width: '460px',
                maxWidth: '72%',
                height: '1.5px',
                background: 'linear-gradient(90deg, transparent 0%, #c8a84b 20%, #e5c365 50%, #c8a84b 80%, transparent 100%)',
                margin: '6px auto 16px',
              }} />

              <p style={{
                fontSize: '14.5px',
                fontWeight: 700,
                color: '#0c2340',
                margin: '0 0 6px',
              }}>
                of {collegeText}
              </p>

              <p style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#334155',
                margin: '0 0 6px',
              }}>
                has successfully qualified in the
              </p>

              <h3 style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#0c2340',
                letterSpacing: '0.3px',
                margin: '0 0 18px',
              }}>
                {qualificationAssessmentTitle}
              </h3>

              {/* Score & Qualifying criteria — bold, sharp, high contrast */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#0c2340',
                margin: '0 0 18px',
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
                fontSize: '11px',
                fontWeight: 500,
                color: '#1e293b',
                lineHeight: 1.6,
                maxWidth: '620px',
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
