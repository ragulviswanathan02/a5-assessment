'use client';

import React, { useRef } from 'react';
import { X, Printer, Award, ShieldCheck } from 'lucide-react';

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
  const certRef = useRef<HTMLDivElement>(null);

  const dateObj = data.issueDate ? new Date(data.issueDate) : new Date();
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const formattedDate = `${dd}/${mm}/${yyyy}`;

  const certId =
    data.id ||
    `A5A-${yyyy}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const qualifyingText =
    data.cutoffPercentage && data.cutoffPercentage > 0
      ? `${data.cutoffPercentage}%`
      : data.cutoffMarks && data.cutoffMarks > 0
      ? `${data.cutoffMarks} Marks`
      : '70%';

  const titleText = data.paperTitle || 'Industrial Automation Aptitude';
  const collegeText = data.studentCollege || 'Your Institution';

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
        href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;500;600;700;800&display=swap"
      />

      {/* Modal shell */}
      <div style={{
        width: '100%', maxWidth: '1000px',
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
            <span style={{ fontWeight: 700, fontSize: '13px', fontFamily: 'Montserrat,sans-serif' }}>
              Official Academy Certificate
            </span>
            <span style={{
              marginLeft: '8px', padding: '2px 10px',
              borderRadius: '999px',
              background: 'rgba(52,211,153,0.15)',
              color: '#6ee7b7', fontSize: '11px', fontWeight: 700,
              border: '1px solid rgba(52,211,153,0.25)',
              fontFamily: 'monospace',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <ShieldCheck style={{ width: 12, height: 12 }} /> {certId}
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
          padding: '32px',
        }}>

          {/* ══════════════════════════════════════════
              CERTIFICATE  950 × 670 px
              CSS-only corners — zero overlap guarantee
          ══════════════════════════════════════════ */}
          <div
            id="printable-certificate"
            ref={certRef}
            style={{
              width: '950px',
              height: '670px',
              position: 'relative',
              background: 'linear-gradient(160deg,#fefefe 0%,#f9f6ef 50%,#fefcf7 100%)',
              overflow: 'hidden',
              fontFamily: "'Montserrat','Segoe UI',sans-serif",
              color: '#1a2b4a',
              flexShrink: 0,
            }}
          >
            {/* ─── CSS-only layered triangle corners ─── */}
            {/* ── Top-Left ── */}
            <div style={{ position:'absolute',top:0,left:0,width:0,height:0,borderStyle:'solid',borderWidth:'115px 115px 0 0',borderColor:'#0c2340 transparent transparent transparent',zIndex:1 }} />
            <div style={{ position:'absolute',top:0,left:0,width:0,height:0,borderStyle:'solid',borderWidth:'100px 100px 0 0',borderColor:'#b8962e transparent transparent transparent',zIndex:2 }} />
            <div style={{ position:'absolute',top:0,left:0,width:0,height:0,borderStyle:'solid',borderWidth:'80px 80px 0 0',borderColor:'#f9f6ef transparent transparent transparent',zIndex:3 }} />
            {/* ── Top-Right ── */}
            <div style={{ position:'absolute',top:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 115px 115px 0',borderColor:'transparent #0c2340 transparent transparent',zIndex:1 }} />
            <div style={{ position:'absolute',top:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 100px 100px 0',borderColor:'transparent #b8962e transparent transparent',zIndex:2 }} />
            <div style={{ position:'absolute',top:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 80px 80px 0',borderColor:'transparent #f9f6ef transparent transparent',zIndex:3 }} />
            {/* ── Bottom-Left ── */}
            <div style={{ position:'absolute',bottom:0,left:0,width:0,height:0,borderStyle:'solid',borderWidth:'115px 0 0 115px',borderColor:'transparent transparent transparent #0c2340',zIndex:1 }} />
            <div style={{ position:'absolute',bottom:0,left:0,width:0,height:0,borderStyle:'solid',borderWidth:'100px 0 0 100px',borderColor:'transparent transparent transparent #b8962e',zIndex:2 }} />
            <div style={{ position:'absolute',bottom:0,left:0,width:0,height:0,borderStyle:'solid',borderWidth:'80px 0 0 80px',borderColor:'transparent transparent transparent #f9f6ef',zIndex:3 }} />
            {/* ── Bottom-Right ── */}
            <div style={{ position:'absolute',bottom:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 0 115px 115px',borderColor:'transparent transparent #0c2340 transparent',zIndex:1 }} />
            <div style={{ position:'absolute',bottom:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 0 100px 100px',borderColor:'transparent transparent #b8962e transparent',zIndex:2 }} />
            <div style={{ position:'absolute',bottom:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 0 80px 80px',borderColor:'transparent transparent #f9f6ef transparent',zIndex:3 }} />

            {/* ─── Outer gold border ─── */}
            <div style={{ position:'absolute',inset:0,border:'3px solid #c8a84b',pointerEvents:'none',zIndex:5 }} />
            {/* ─── Inner thin gold border ─── */}
            <div style={{ position:'absolute',inset:'12px',border:'1px solid rgba(200,168,75,0.45)',pointerEvents:'none',zIndex:5 }} />

            {/* ════════════════ CONTENT (z-index 10, all clear of corners) ════════════════ */}
            <div style={{
              position:'relative', zIndex:10,
              height:'100%',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'space-between',
              textAlign:'center',
              padding:'28px 90px 24px',
            }}>

              {/* ── HEADER: Logo + Title ── */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/a5a-academy-logo.png"
                  alt="A5 Automation Training Academy"
                  style={{ height:'60px', objectFit:'contain', display:'block', margin:'0 auto 8px' }}
                />
                <p style={{
                  fontFamily:"'Cormorant Garamond','Times New Roman',serif",
                  fontSize:'13px', fontWeight:600,
                  letterSpacing:'5px', color:'#1a2b4a',
                  textTransform:'uppercase', margin:'0 0 3px',
                }}>
                  Certificate of
                </p>
                {/* Short gold rule */}
                <div style={{
                  width:'50px', height:'2px',
                  background:'linear-gradient(90deg,transparent,#c8a84b,transparent)',
                  margin:'0 auto 4px',
                }} />
                <h1 style={{
                  fontFamily:"'Cormorant Garamond','Times New Roman',serif",
                  fontSize:'26px', fontWeight:700,
                  letterSpacing:'2.5px', color:'#0c2340',
                  textTransform:'uppercase', lineHeight:1.2, margin:0,
                }}>
                  {titleText}
                </h1>
              </div>

              {/* ── BODY: Recipient ── */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>
                <p style={{
                  fontSize:'12px', fontWeight:500, color:'#64748b',
                  letterSpacing:'1px', margin:'0 0 4px',
                }}>
                  This is to certify that
                </p>

                {/* Student name — Great Vibes cursive */}
                <div style={{
                  fontFamily:"'Great Vibes','Brush Script MT',cursive",
                  fontSize:'58px', color:'#0c2340',
                  fontWeight:400, lineHeight:1.1,
                  margin:'0 0 2px', letterSpacing:'1px',
                }}>
                  {data.studentName || 'Student Full Name'}
                </div>

                {/* Gold gradient underline */}
                <div style={{
                  width:'340px', height:'1.5px',
                  background:'linear-gradient(90deg,transparent 0%,#c8a84b 25%,#f0d060 50%,#c8a84b 75%,transparent 100%)',
                  margin:'4px auto 12px',
                }} />

                <p style={{ fontSize:'13.5px', fontWeight:700, color:'#0c2340', margin:'0 0 3px' }}>
                  of {collegeText}
                </p>
                <p style={{ fontSize:'12px', color:'#475569', margin:'0 0 3px' }}>
                  has successfully qualified in the
                </p>
                <h3 style={{
                  fontSize:'15px', fontWeight:800, color:'#0c2340',
                  letterSpacing:'0.3px', margin:'0 0 12px',
                }}>
                  {titleText} Assessment
                </h3>

                {/* Score pill */}
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:'14px',
                  padding:'5px 22px', borderRadius:'999px',
                  background:'rgba(255,255,255,0.85)',
                  border:'1.5px solid #d1d5db',
                  fontSize:'11.5px', fontWeight:700, color:'#0c2340',
                  marginBottom:'10px',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  <span>
                    Assessment Score:{' '}
                    <strong style={{ color:'#0284c7' }}>
                      {Math.round(data.percentage)}%
                    </strong>
                  </span>
                  <span style={{ color:'#d1d5db', fontWeight:400 }}>|</span>
                  <span>
                    Minimum Qualifying Score:{' '}
                    <strong>{qualifyingText}</strong>
                  </span>
                </div>

                {/* Disclaimer */}
                <p style={{
                  fontSize:'9px', color:'#94a3b8', lineHeight:1.55,
                  maxWidth:'560px', margin:0,
                }}>
                  This certificate recognizes technical aptitude and eligibility for the A5A Automation Training Academy course admission benefit.{' '}
                  It does not represent completion of the full training program.
                </p>
              </div>

              {/* ── FOOTER: Credential | Seal | Date ── */}
              <div style={{
                width:'100%',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                {/* Credential ID */}
                <div style={{ textAlign:'left' }}>
                  <p style={{
                    fontSize:'8px', fontWeight:700, color:'#64748b',
                    textTransform:'uppercase', letterSpacing:'1.5px',
                    margin:'0 0 2px',
                  }}>
                    Credential ID
                  </p>
                  <p style={{
                    fontFamily:'monospace', fontSize:'10px', fontWeight:700,
                    color:'#0c2340', margin:'0 0 2px',
                  }}>
                    {certId}
                  </p>
                  <p style={{ fontSize:'8px', color:'#16a34a', fontWeight:600, margin:0 }}>
                    ✓ Verified Academy Record
                  </p>
                </div>

                {/* Laurel Seal */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/a5a-laurel-seal.png"
                    alt="A5A Official Seal"
                    style={{ height:'76px', width:'auto', objectFit:'contain' }}
                  />
                </div>

                {/* Date */}
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:'10px', fontWeight:600, color:'#475569', margin:'0 0 2px' }}>
                    Date of Assessment
                  </p>
                  <p style={{ fontSize:'13px', fontWeight:800, color:'#0c2340', margin:0 }}>
                    {formattedDate}
                  </p>
                </div>
              </div>

            </div>{/* end content */}
          </div>{/* end certificate */}
        </div>{/* end scroll area */}
      </div>{/* end modal */}

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
