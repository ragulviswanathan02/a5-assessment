'use client';

import React, { useRef, useEffect } from 'react';
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

  const rawTitle = data.paperTitle || 'Industrial Automation Aptitude';
  const cleanTitle = rawTitle.trim().replace(/(?:\s+Assessment)+$/i, '');
  const titleText = `${cleanTitle} ASSESSMENT`;
  const qualificationAssessmentTitle = `${cleanTitle} Assessment`;
  const collegeText = data.studentCollege || 'Your Institution';
  const displayName = formatDisplayName(data.studentName);
  const pdfFileName = `${displayName} - A5 Automation Certificate`;

  // Dynamically set document title while modal is open so browser Save As PDF defaults to candidate name
  useEffect(() => {
    const originalTitle = document.title;
    document.title = pdfFileName;
    return () => {
      document.title = originalTitle;
    };
  }, [pdfFileName]);

  const handlePrint = () => {
    const certElement = certRef.current;
    if (!certElement) {
      window.print();
      return;
    }

    // Create an isolated hidden iframe for single-page, zero-overflow printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${pdfFileName}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700;800&display=swap" />
          <style>
            @page {
              size: A4 landscape;
              margin: 0 !important;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              max-height: 100vh !important;
              overflow: hidden !important;
              background: #fff !important;
              display: flex;
              align-items: center;
              justify-content: center;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            .cert-print-stage {
              width: 100vw;
              height: 100vh;
              max-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              margin: 0;
              padding: 0;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            .cert-scaler {
              width: 1024px;
              height: 679px;
              position: relative;
              /* Scale 1024x679 cleanly to fit A4 landscape (approx 1123 x 744 px) */
              transform: scale(min(calc(100vw / 1024), calc(100vh / 679)));
              transform-origin: center center;
              box-shadow: none !important;
              flex-shrink: 0;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div class="cert-print-stage">
            <div class="cert-scaler">
              ${certElement.innerHTML}
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Allow browser time to parse fonts and layout before opening print dialog
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 400);
  };

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
              onClick={handlePrint}
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
              fontFamily: "'Montserrat','Segoe UI',sans-serif",
              color: '#0c2340',
              flexShrink: 0,
              boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* Explicit base frame artwork image tag — prints reliably in all browsers even if 'Background graphics' is turned off */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/a5a-certificate-base.png"
              alt="Certificate Frame"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />

            {/* ── Flowing Content Area (balanced vertical rhythm with comfortable clearance above bottom seal) ── */}
            <div style={{
              position: 'absolute',
              top: '42px',
              left: '120px',
              right: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              zIndex: 1,
            }}>

              {/* Official Academy Header Logo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/a5-company-logo.png"
                  alt="A5 Automation"
                  style={{ height: '50px', width: 'auto', objectFit: 'contain', marginBottom: '3px' }}
                />
                <div style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '12.5px',
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
                  margin: '2px 0',
                }}>
                  <div style={{ width: '46px', height: '1.2px', background: '#c8a84b' }} />
                  <span style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '8.5px',
                    fontWeight: 700,
                    letterSpacing: '3px',
                    color: '#0c2340',
                  }}>
                    TRAINING ACADEMY
                  </span>
                  <div style={{ width: '46px', height: '1.2px', background: '#c8a84b' }} />
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
                fontSize: '14.5px',
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
                fontSize: '25px',
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#0c2340',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                margin: '0 0 18px',
                maxWidth: '680px',
              }}>
                {titleText}
              </h1>

              {/* Recipient & Qualification Details */}
              <p style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#1a2b4a',
                margin: '0 0 3px',
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
                width: '450px',
                maxWidth: '70%',
                height: '1.5px',
                background: 'linear-gradient(90deg, transparent 0%, #c8a84b 20%, #e5c365 50%, #c8a84b 80%, transparent 100%)',
                margin: '5px auto 13px',
              }} />

              <p style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#0c2340',
                margin: '0 0 4px',
              }}>
                of {collegeText}
              </p>

              <p style={{
                fontSize: '12.5px',
                fontWeight: 500,
                color: '#334155',
                margin: '0 0 4px',
              }}>
                has successfully qualified in the
              </p>

              <h3 style={{
                fontSize: '16.5px',
                fontWeight: 800,
                color: '#0c2340',
                letterSpacing: '0.3px',
                margin: '0 0 15px',
              }}>
                {qualificationAssessmentTitle}
              </h3>

              {/* Score & Qualifying criteria — bold, sharp, high contrast */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#0c2340',
                margin: '0 0 15px',
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

              {/* Academy Disclaimer — sharp, readable dark slate, with 35-40px clearance above laurel seal */}
              <p style={{
                fontSize: '10.5px',
                fontWeight: 500,
                color: '#1e293b',
                lineHeight: 1.5,
                maxWidth: '640px',
                margin: '0 auto',
                letterSpacing: '0.1px',
              }}>
                This certificate recognizes technical aptitude and eligibility for the A5A Automation Training Academy course admission benefit.{' '}
                It does not represent completion of the full training program.
              </p>

            </div>

            {/* Date with elegant gold rule on the right */}
            <div style={{
              position: 'absolute',
              top: '574px',
              left: '576px',
              width: '232px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1,
            }}>
              <div style={{
                width: '180px',
                height: '1.2px',
                background: 'linear-gradient(90deg, transparent 0%, #c8a84b 20%, #e5c365 50%, #c8a84b 80%, transparent 100%)',
                marginBottom: '5px',
              }} />
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#1e293b',
                margin: 0,
                letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
              }}>
                Date of Assessment: <strong style={{ color: '#0c2340', fontWeight: 800 }}>{formattedDate}</strong>
              </p>
            </div>

          </div>{/* end certificate */}
        </div>{/* end scroll area */}
      </div>{/* end modal shell */}

      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 0 !important;
        }
        @media print {
          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100vh !important;
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-certificate,
          #printable-certificate * {
            visibility: visible !important;
          }
          #printable-certificate {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) scale(1.08) !important;
            transform-origin: center center !important;
            width: 1024px !important;
            height: 679px !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
