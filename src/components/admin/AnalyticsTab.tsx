'use client';

import React, { useState, useMemo } from 'react';
import { Paper, Submission } from '@/types/database';
import CertificateModal, { CertificateData } from '@/components/certificate/CertificateModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  Download,
  Search,
  Trophy,
  Users,
  Award,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Printer,
  ShieldCheck,
  Trash2,
  Loader2,
  Filter,
  Building2,
  RotateCcw,
} from 'lucide-react';

interface Props {
  papers: Paper[];
  selectedPaperId: string;
  onSelectPaperId: (id: string) => void;
  submissions: Submission[];
  onRefresh?: () => void;
}

function parseNum(val: any, fallback: number): number {
  if (val === undefined || val === null || val === '') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function getPaperCert(p?: Paper) {
  if (!p) {
    return {
      enabled: false,
      minMarks: 10,
      minPercentage: 0,
      title: 'Industrial Automation Skill Training Program',
      signatory: 'Director',
      signatoryTitle: 'A5 Automation',
    };
  }
  let cert = {
    enabled: !!p.certificate_enabled,
    minMarks: parseNum(p.certificate_min_marks, 10),
    minPercentage: parseNum(p.certificate_min_percentage, 0),
    title: p.certificate_title || p.title || 'Industrial Automation Skill Training Program',
    signatory: p.certificate_signatory || 'Director',
    signatoryTitle: p.certificate_signatory_title || 'A5 Automation',
  };
  if (p.description && p.description.includes('[CERT_CFG:')) {
    try {
      const match = p.description.match(/\[CERT_CFG:(.*?)\]/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (parsed.enabled !== undefined) cert.enabled = !!parsed.enabled;
        if (parsed.minMarks !== undefined && parsed.minMarks !== null) cert.minMarks = parseNum(parsed.minMarks, cert.minMarks);
        if (parsed.minPercentage !== undefined && parsed.minPercentage !== null) cert.minPercentage = parseNum(parsed.minPercentage, 0);
        if (parsed.title) cert.title = parsed.title;
        if (parsed.signatory) cert.signatory = parsed.signatory;
        if (parsed.signatoryTitle) cert.signatoryTitle = parsed.signatoryTitle;
      }
    } catch (e) {}
  }
  return cert;
}

function checkSubmissionEligibility(sub: Submission, cert: ReturnType<typeof getPaperCert>): boolean {
  const certInfo = (sub.student_data as any)?._certificate;
  // If already marked as issued in database, always honor it
  if (certInfo?.issued === true || sub.certificate_issued === true) return true;
  // If certificates are completely disabled on this paper
  if (!cert.enabled) return false;

  const hasMarks = cert.minMarks > 0;
  const hasPercent = cert.minPercentage > 0;
  if (hasMarks && hasPercent) {
    return sub.total_score >= cert.minMarks || sub.percentage >= cert.minPercentage;
  }
  if (hasPercent) {
    return sub.percentage >= cert.minPercentage;
  }
  if (hasMarks) {
    return sub.total_score >= cert.minMarks;
  }
  return true;
}

export default function AnalyticsTab({
  papers,
  selectedPaperId,
  onSelectPaperId,
  submissions,
  onRefresh,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'qualified' | 'not_qualified'>('all');
  const [inspectSubmission, setInspectSubmission] = useState<Submission | null>(null);
  const [activeCertData, setActiveCertData] = useState<CertificateData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reset filters when changing active question paper
  React.useEffect(() => {
    setSelectedCollege('all');
    setSelectedStatus('all');
    setSearchQuery('');
  }, [selectedPaperId]);

  const handleDeleteSubmission = async (sub: Submission) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the submission for ${sub.student_name}?\n\nThis will permanently delete their result and certificate record.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(sub.id);
      const res = await fetch(`/api/admin/submissions?id=${sub.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete submission');
      }

      if (inspectSubmission?.id === sub.id) {
        setInspectSubmission(null);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      alert('Error deleting submission: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const currentPaper = papers.find((p) => p.id === selectedPaperId);
  const currentCert = useMemo(() => getPaperCert(currentPaper), [currentPaper]);

  // Filter submissions by current paper
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => sub.paper_id === selectedPaperId);
  }, [submissions, selectedPaperId]);

  // Distinct list of colleges with counts for dropdown filter
  const availableColleges = useMemo(() => {
    const counts = new Map<string, number>();
    filteredSubmissions.forEach((sub) => {
      const col = (sub.student_college || '').trim();
      if (col) {
        counts.set(col, (counts.get(col) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [filteredSubmissions]);

  // Qualified vs Not-Qualified counts for current paper
  const { qualifiedCount, notQualifiedCount } = useMemo(() => {
    let q = 0;
    let nq = 0;
    filteredSubmissions.forEach((sub) => {
      if (checkSubmissionEligibility(sub, currentCert)) {
        q++;
      } else {
        nq++;
      }
    });
    return { qualifiedCount: q, notQualifiedCount: nq };
  }, [filteredSubmissions, currentCert]);

  // Search & Filtered submissions: by College, Qualification Status, and Search Query
  const searchedSubmissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const list = filteredSubmissions.filter((sub) => {
      // 1. College filter
      if (selectedCollege !== 'all') {
        const subCol = (sub.student_college || '').trim();
        if (subCol !== selectedCollege) return false;
      }

      // 2. Qualification status filter
      if (selectedStatus !== 'all') {
        const isEligible = checkSubmissionEligibility(sub, currentCert);
        if (selectedStatus === 'qualified' && !isEligible) return false;
        if (selectedStatus === 'not_qualified' && isEligible) return false;
      }

      // 3. Search query
      if (q) {
        const matchName = (sub.student_name || '').toLowerCase().includes(q);
        const matchEmail = (sub.student_email || '').toLowerCase().includes(q);
        const matchPhone = (sub.student_phone || '').toLowerCase().includes(q);
        const matchCollege = (sub.student_college || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchCollege) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if ((b.percentage || 0) !== (a.percentage || 0)) return (b.percentage || 0) - (a.percentage || 0);
      return (a.time_taken_seconds || 0) - (b.time_taken_seconds || 0);
    });
  }, [filteredSubmissions, selectedCollege, selectedStatus, searchQuery, currentCert]);

  // Metrics with dynamic pass cutoff from paper settings
  const metrics = useMemo(() => {
    const total = filteredSubmissions.length;
    const hasCert = currentCert.enabled;
    const hasPercentCutoff = hasCert && currentCert.minPercentage > 0;
    const hasMarksCutoff = hasCert && currentCert.minMarks > 0;

    let cutoffLabel = '≥50% passing cutoff';
    if (hasPercentCutoff && hasMarksCutoff) {
      cutoffLabel = `≥${currentCert.minPercentage}% or ≥${currentCert.minMarks}m cutoff`;
    } else if (hasPercentCutoff) {
      cutoffLabel = `≥${currentCert.minPercentage}% passing cutoff`;
    } else if (hasMarksCutoff) {
      cutoffLabel = `≥${currentCert.minMarks} marks cutoff`;
    }

    if (total === 0) {
      return { total: 0, avgPct: 0, highest: 0, passCount: 0, passRate: 0, cutoffLabel };
    }

    let totalPct = 0;
    let highest = 0;
    let passCount = 0;

    filteredSubmissions.forEach((sub) => {
      totalPct += sub.percentage || 0;
      if (sub.total_score > highest) highest = sub.total_score;

      const passed = (hasPercentCutoff || hasMarksCutoff)
        ? checkSubmissionEligibility(sub, currentCert)
        : sub.percentage >= 50;

      if (passed) passCount++;
    });

    return {
      total,
      avgPct: Math.round((totalPct / total) * 10) / 10,
      highest,
      passCount,
      passRate: Math.round((passCount / total) * 100),
      cutoffLabel,
    };
  }, [filteredSubmissions, currentCert]);

  // Qualified Performers for Bar Chart in Performance Order (All qualified students)
  const topPerformersChartData = useMemo(() => {
    // 1. Filter ONLY candidates who met the qualification criteria
    const qualified = filteredSubmissions.filter((sub) =>
      checkSubmissionEligibility(sub, currentCert)
    );

    // 2. Sort in strict performance order:
    //    Score DESC -> Percentage DESC -> Faster Time ASC
    return [...qualified]
      .sort((a, b) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score;
        if ((b.percentage || 0) !== (a.percentage || 0)) return (b.percentage || 0) - (a.percentage || 0);
        return (a.time_taken_seconds || 0) - (b.time_taken_seconds || 0);
      })
      .map((sub, idx) => ({
        rank: idx + 1,
        name: (sub.student_name || '').trim().split(' ')[0] || sub.student_name,
        fullName: sub.student_name,
        score: sub.total_score,
        maxScore: sub.max_score,
        percentage: sub.percentage,
        college: sub.student_college,
        timeTakenMinutes: Math.round((sub.time_taken_seconds || 0) / 60),
      }));
  }, [filteredSubmissions, currentCert]);

  // Topic Performance Breakdown
  const topicPerformanceData = useMemo(() => {
    const topicTotals: Record<string, { scored: number; max: number }> = {};

    filteredSubmissions.forEach((sub) => {
      if (sub.topic_scores) {
        Object.entries(sub.topic_scores).forEach(([topic, data]) => {
          if (!topicTotals[topic]) {
            topicTotals[topic] = { scored: 0, max: 0 };
          }
          topicTotals[topic].scored += data.scored || 0;
          topicTotals[topic].max += data.total || 0;
        });
      }
    });

    return Object.entries(topicTotals).map(([topic, data]) => ({
      topic,
      averagePercentage:
        data.max > 0 ? Math.round((data.scored / data.max) * 100) : 0,
    }));
  }, [filteredSubmissions]);

  // College-wise Distribution
  const collegeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSubmissions.forEach((sub) => {
      const col = sub.student_college || 'Unspecified';
      counts[col] = (counts[col] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredSubmissions]);

  // Export to Excel / CSV with proper competition rank sorting (respects active college & qualification filters)
  const handleExportExcel = () => {
    const listToExport = searchedSubmissions;
    if (listToExport.length === 0) {
      alert('No submission data matches the selected filters to export.');
      return;
    }

    // Sort submissions for true ranking:
    // 1. Total score DESC (highest first)
    // 2. Percentage DESC
    // 3. Time taken ASC (tie-breaker: faster attempt gets higher rank)
    // 4. Submitted at ASC (earlier attempt gets higher rank)
    const sortedSubmissions = [...listToExport].sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      if ((b.percentage || 0) !== (a.percentage || 0)) {
        return (b.percentage || 0) - (a.percentage || 0);
      }
      if ((a.time_taken_seconds || 0) !== (b.time_taken_seconds || 0)) {
        return (a.time_taken_seconds || 0) - (b.time_taken_seconds || 0);
      }
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    });

    let currentRank = 1;
    const rows = sortedSubmissions.map((sub, index) => {
      if (index > 0) {
        const prev = sortedSubmissions[index - 1];
        if (sub.total_score === prev.total_score && (sub.percentage || 0) === (prev.percentage || 0)) {
          // Tied with previous student: same rank
        } else {
          currentRank = index + 1;
        }
      } else {
        currentRank = 1;
      }

      const isEligible = checkSubmissionEligibility(sub, currentCert);
      const certInfo = (sub.student_data as any)?._certificate;
      const certId = certInfo?.id || sub.certificate_id || (isEligible ? `A5-2026-${sub.id.substring(0, 6).toUpperCase()}` : 'N/A');

      const base: Record<string, any> = {
        'Rank': currentRank,
        'Student Name': sub.student_name,
        'Email Address': sub.student_email,
        'Phone Number': sub.student_phone,
        'College Name': sub.student_college,
        'Total Score': sub.total_score,
        'Max Score': sub.max_score,
        'Percentage (%)': sub.percentage,
        'Certificate Status': isEligible ? 'Qualified' : currentCert.enabled ? 'Below Cutoff' : 'Not Configured',
        'Certificate ID': isEligible ? certId : 'N/A',
        'Tab Switches': sub.tab_switch_count,
        'Time Taken (seconds)': sub.time_taken_seconds,
        'Submitted At': new Date(sub.submitted_at).toLocaleString(),
      };

      // Add dynamic student form data
      if (sub.student_data) {
        Object.entries(sub.student_data).forEach(([key, val]) => {
          if (!['full_name', 'email', 'phone', 'college', '_certificate'].includes(key)) {
            base[`Field: ${key}`] = val;
          }
        });
      }

      // Add topic-wise scores
      if (sub.topic_scores) {
        Object.entries(sub.topic_scores).forEach(([topic, tScore]) => {
          base[`Topic: ${topic} (%)`] = tScore.percentage;
        });
      }

      return base;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates Results');

    const selectedPaper = papers.find((p) => p.id === selectedPaperId);
    let filterTag = '';
    if (selectedCollege !== 'all') {
      filterTag += `_${selectedCollege.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    if (selectedStatus !== 'all') {
      filterTag += `_${selectedStatus === 'qualified' ? 'Qualified' : 'BelowCutoff'}`;
    }
    const fileName = `${(selectedPaper?.title || 'Assessment').replace(/[^a-zA-Z0-9]/g, '_')}${filterTag}_Results.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Top Paper Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Selected Assessment Paper
          </label>
          <select
            value={selectedPaperId}
            onChange={(e) => onSelectPaperId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.is_active ? '🟢 (LIVE)' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          title="Export currently filtered list of candidates to Excel"
        >
          <Download className="w-4 h-4" />
          <span>
            Export to Excel (XLSX){' '}
            {searchedSubmissions.length < filteredSubmissions.length
              ? `(${searchedSubmissions.length} Filtered)`
              : `(${filteredSubmissions.length})`}
          </span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Candidates</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900">{metrics.total}</span>
          <p className="text-xs text-slate-500 mt-0.5">Total submissions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Average Score</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900">{metrics.avgPct}%</span>
          <p className="text-xs text-slate-500 mt-0.5">Batch average</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Qualified Candidates</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{metrics.passCount}</span>
            <span className="text-xs font-medium text-slate-400">/ {metrics.total} students</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Eligible for Certificate (Top Mark: {metrics.highest})
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pass Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900">{metrics.passRate}%</span>
          <p className="text-xs text-slate-500 mt-0.5">{metrics.cutoffLabel}</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      {filteredSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Students Bar Chart: All qualified candidates in performance order */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-900">Top Performers Leaderboard</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  {topPerformersChartData.length} Qualified
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                All qualified candidates ranked in performance order by score &amp; speed
              </p>
            </div>

            {topPerformersChartData.length > 0 ? (
              <div className="h-64 w-full overflow-x-auto">
                <div
                  className="h-full"
                  style={{
                    minWidth: `${Math.max(100, topPerformersChartData.length * (topPerformersChartData.length > 8 ? 55 : 45))}px`,
                    width: '100%',
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topPerformersChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: topPerformersChartData.length > 6 ? 28 : 10 }}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                        interval={0}
                        angle={topPerformersChartData.length > 6 ? -25 : 0}
                        textAnchor={topPerformersChartData.length > 6 ? 'end' : 'middle'}
                      />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 text-xs">
                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                                    #{data.rank}
                                  </span>
                                  <span>{data.fullName}</span>
                                </p>
                                <p className="text-slate-600 mt-1">College: {data.college || 'N/A'}</p>
                                <p className="text-indigo-600 font-semibold mt-1">
                                  Score: {data.score} / {data.maxScore} ({data.percentage}%)
                                </p>
                                {data.timeTakenMinutes > 0 && (
                                  <p className="text-slate-400 text-[11px] mt-0.5">
                                    Time Taken: {data.timeTakenMinutes} min
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Award className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Qualified Candidates Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Once candidates achieve the {metrics.cutoffLabel}, their performance will be ranked here.
                </p>
              </div>
            )}
          </div>

          {/* Topic-Wise Performance Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Topic-Wise Performance Average</h3>
            <p className="text-xs text-slate-500 mb-4">Average mastery (%) across different syllabus topics</p>
            <div className="h-64 w-full">
              {topicPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicPerformanceData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                    <YAxis dataKey="topic" type="category" stroke="#64748b" fontSize={11} width={90} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Average Mastery']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Bar dataKey="averagePercentage" fill="#06b6d4" radius={[0, 6, 6, 0]}>
                      {topicPerformanceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No topic breakdown data available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Submissions Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Once students fill the form and submit their answers, live charts and candidate marks will reflect here automatically.
          </p>
        </div>
      )}

      {/* Student Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Student Submissions Directory</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {searchedSubmissions.length} of {filteredSubmissions.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">Comprehensive list of candidate attempts and contact records</p>
          </div>

          {/* Filter Toolbar: College, Qualification Status, Search & Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* College Filter Dropdown */}
            <div className="relative min-w-[170px] flex-1 sm:flex-initial">
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full appearance-none pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                title="Filter by Candidate College"
              >
                <option value="all">All Colleges ({filteredSubmissions.length})</option>
                {availableColleges.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.count})
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Qualification Filter Dropdown */}
            <div className="relative min-w-[160px] flex-1 sm:flex-initial">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full appearance-none pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                title="Filter by Qualification Status"
              >
                <option value="all">All Candidates ({filteredSubmissions.length})</option>
                <option value="qualified">Qualified ({qualifiedCount})</option>
                <option value="not_qualified">Below Cutoff ({notQualifiedCount})</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-52">
              <input
                type="text"
                placeholder="Search name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Reset Filters Button */}
            {(selectedCollege !== 'all' || selectedStatus !== 'all' || searchQuery.trim() !== '') && (
              <button
                onClick={() => {
                  setSelectedCollege('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                title="Clear all active filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Table Export XLSX button */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="Export currently filtered candidates to Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export XLSX</span>
            </button>
          </div>
        </div>

        {/* Mobile View: Clean card list for screens < 768px */}
        <div className="block md:hidden space-y-3">
          {searchedSubmissions.map((sub) => {
            const isEligible = checkSubmissionEligibility(sub, currentCert);
            const certInfo = (sub.student_data as any)?._certificate;
            const certId = certInfo?.id || sub.certificate_id || (isEligible ? `A5-2026-${sub.id.substring(0, 6).toUpperCase()}` : '');

            return (
              <div key={sub.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">{sub.student_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{sub.student_college || 'No institution provided'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        sub.percentage >= 75
                          ? 'bg-emerald-50 text-emerald-700'
                          : sub.percentage >= 40
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {sub.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Score</span>
                    <span className="font-bold text-slate-800">{sub.total_score} / {sub.max_score}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status</span>
                    {isEligible ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>Qualified</span>
                      </span>
                    ) : currentCert.enabled ? (
                      <span className="text-slate-400 text-[11px]">Below Cutoff</span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact</span>
                    <span className="text-slate-700 truncate block">{sub.student_phone || sub.student_email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tab Switches</span>
                    {sub.tab_switch_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        {sub.tab_switch_count} violations
                      </span>
                    ) : (
                      <span className="text-slate-500">0 violations</span>
                    )}
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {isEligible && (
                    <button
                      onClick={() =>
                        setActiveCertData({
                          id: certId,
                          studentName: sub.student_name,
                          studentCollege: sub.student_college,
                          paperTitle: currentCert.title,
                          score: sub.total_score,
                          maxScore: sub.max_score,
                          percentage: sub.percentage,
                          cutoffPercentage: currentCert.minPercentage,
                          cutoffMarks: currentCert.minMarks,
                          issueDate: sub.submitted_at,
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Cert</span>
                    </button>
                  )}
                  <button
                    onClick={() => setInspectSubmission(sub)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSubmission(sub)}
                    disabled={deletingId === sub.id}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                    title="Delete submission"
                  >
                    {deletingId === sub.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {searchedSubmissions.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching student records found.
            </div>
          )}
        </div>

        {/* Desktop View: Full Width Table with Sticky Actions */}
        <div className="hidden md:block overflow-x-auto rounded-xl">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/90 text-slate-600 font-semibold">
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[150px]">Student Name</th>
                <th className="py-3 px-3.5 min-w-[170px]">College</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[160px]">Contact</th>
                <th className="py-3 px-3 text-center whitespace-nowrap min-w-[80px]">Score</th>
                <th className="py-3 px-3 text-center whitespace-nowrap min-w-[85px]">Percentage</th>
                <th className="py-3 px-3 text-center whitespace-nowrap min-w-[95px]">Certificate</th>
                <th className="py-3 px-3 text-center whitespace-nowrap min-w-[90px]">Tab Switches</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[95px]">Date</th>
                <th className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50 z-20 shadow-[-6px_0_12px_rgba(0,0,0,0.04)] min-w-[210px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {searchedSubmissions.map((sub) => {
                const isEligible = checkSubmissionEligibility(sub, currentCert);
                const certInfo = (sub.student_data as any)?._certificate;
                const certId = certInfo?.id || sub.certificate_id || (isEligible ? `A5-2026-${sub.id.substring(0, 6).toUpperCase()}` : '');

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/90 group transition-colors">
                    <td className="py-3 px-3.5 font-medium text-slate-900 whitespace-nowrap">{sub.student_name}</td>
                    <td className="py-3 px-3.5 text-slate-600 max-w-[220px] truncate" title={sub.student_college || ''}>
                      {sub.student_college || '—'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                      <div>{sub.student_phone || '—'}</div>
                      <div className="text-[11px] text-slate-400">{sub.student_email || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                      {sub.total_score} / {sub.max_score}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold ${
                          sub.percentage >= 75
                            ? 'bg-emerald-50 text-emerald-700'
                            : sub.percentage >= 40
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isEligible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                          <Award className="w-3 h-3 text-amber-600" />
                          <span>Qualified</span>
                        </span>
                      ) : currentCert.enabled ? (
                        <span className="text-[11px] text-slate-400">Below Cutoff</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {sub.tab_switch_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          {sub.tab_switch_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 z-20 shadow-[-6px_0_12px_rgba(0,0,0,0.04)] min-w-[210px]">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEligible && (
                          <button
                            onClick={() =>
                              setActiveCertData({
                                id: certId,
                                studentName: sub.student_name,
                                studentCollege: sub.student_college,
                                paperTitle: currentCert.title,
                                score: sub.total_score,
                                maxScore: sub.max_score,
                                percentage: sub.percentage,
                                cutoffPercentage: currentCert.minPercentage,
                                cutoffMarks: currentCert.minMarks,
                                issueDate: sub.submitted_at,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors text-xs font-semibold cursor-pointer"
                            title="View & Print Official Certificate"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>Cert</span>
                          </button>
                        )}
                        <button
                          onClick={() => setInspectSubmission(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(sub)}
                          disabled={deletingId === sub.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer text-xs font-semibold disabled:opacity-50"
                          title="Delete this submission record"
                        >
                          {deletingId === sub.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {searchedSubmissions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching student records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detailed Inspect Modal */}
      {inspectSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Candidate Profile & Report</h3>
              <button
                onClick={() => setInspectSubmission(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Profile Card */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 mb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-900">{inspectSubmission.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">College:</span>
                <span className="font-semibold text-slate-900">{inspectSubmission.student_college || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700">{inspectSubmission.student_email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-700">{inspectSubmission.student_phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tab Switches:</span>
                <span className="font-semibold text-amber-600">{inspectSubmission.tab_switch_count} violations</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Taken:</span>
                <span className="text-slate-700">{Math.round(inspectSubmission.time_taken_seconds / 60)} minutes</span>
              </div>
            </div>

            {/* Dynamic Custom Fields */}
            {inspectSubmission.student_data && (
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Registration Details
                </h4>
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
                  {Object.entries(inspectSubmission.student_data).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-500 capitalize">{key.replace('_', ' ')}:</span>
                      <span className="text-slate-800 font-medium">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topic Scores */}
            {inspectSubmission.topic_scores && (
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Topic Mastery
                </h4>
                <div className="space-y-2">
                  {Object.entries(inspectSubmission.topic_scores).map(([top, val]) => (
                    <div key={top} className="text-xs">
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>{top}</span>
                        <span className="font-semibold">
                          {val.scored} / {val.total} ({val.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${val.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteSubmission(inspectSubmission)}
                disabled={deletingId === inspectSubmission.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {deletingId === inspectSubmission.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Submission</span>
              </button>
              <button
                onClick={() => setInspectSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview & Print Modal */}
      {activeCertData && (
        <CertificateModal
          data={activeCertData}
          onClose={() => setActiveCertData(null)}
        />
      )}
    </div>
  );
}
