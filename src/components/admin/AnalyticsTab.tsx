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
} from 'lucide-react';

interface Props {
  papers: Paper[];
  selectedPaperId: string;
  onSelectPaperId: (id: string) => void;
  submissions: Submission[];
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

export default function AnalyticsTab({
  papers,
  selectedPaperId,
  onSelectPaperId,
  submissions,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectSubmission, setInspectSubmission] = useState<Submission | null>(null);
  const [activeCertData, setActiveCertData] = useState<CertificateData | null>(null);

  const currentPaper = papers.find((p) => p.id === selectedPaperId);
  const currentCert = useMemo(() => getPaperCert(currentPaper), [currentPaper]);

  // Filter submissions by current paper
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => sub.paper_id === selectedPaperId);
  }, [submissions, selectedPaperId]);

  // Search filtered
  const searchedSubmissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return filteredSubmissions;
    return filteredSubmissions.filter(
      (sub) =>
        sub.student_name.toLowerCase().includes(q) ||
        sub.student_email.toLowerCase().includes(q) ||
        sub.student_phone.toLowerCase().includes(q) ||
        sub.student_college.toLowerCase().includes(q)
    );
  }, [filteredSubmissions, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = filteredSubmissions.length;
    if (total === 0) return { total: 0, avgPct: 0, highest: 0, passCount: 0, passRate: 0 };

    let totalPct = 0;
    let highest = 0;
    let passCount = 0;

    filteredSubmissions.forEach((sub) => {
      totalPct += sub.percentage || 0;
      if (sub.total_score > highest) highest = sub.total_score;
      if (sub.percentage >= 50) passCount++;
    });

    return {
      total,
      avgPct: Math.round((totalPct / total) * 10) / 10,
      highest,
      passCount,
      passRate: Math.round((passCount / total) * 100),
    };
  }, [filteredSubmissions]);

  // Top Performers for Bar Chart
  const topPerformersChartData = useMemo(() => {
    return [...filteredSubmissions]
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 8)
      .map((sub) => ({
        name: sub.student_name.split(' ')[0] || sub.student_name,
        fullName: sub.student_name,
        score: sub.total_score,
        percentage: sub.percentage,
        college: sub.student_college,
      }));
  }, [filteredSubmissions]);

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

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (filteredSubmissions.length === 0) {
      alert('No submission data available to export.');
      return;
    }

    const rows = filteredSubmissions.map((sub, index) => {
      const certInfo = (sub.student_data as any)?._certificate;
      const isEligible = certInfo?.issued || sub.certificate_issued || (currentCert.enabled && sub.total_score >= currentCert.minMarks);
      const certId = certInfo?.id || sub.certificate_id || (isEligible ? `A5-2026-${sub.id.substring(0, 6).toUpperCase()}` : 'N/A');

      const base: Record<string, any> = {
        'Rank': index + 1,
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
    const fileName = `${(selectedPaper?.title || 'Assessment').replace(/[^a-zA-Z0-9]/g, '_')}_Results.xlsx`;
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
        >
          <Download className="w-4 h-4" />
          <span>Export to Excel (XLSX)</span>
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
            <span className="text-xs font-semibold text-slate-500 uppercase">Top Mark</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900">{metrics.highest}</span>
          <p className="text-xs text-slate-500 mt-0.5">Highest marks scored</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pass Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900">{metrics.passRate}%</span>
          <p className="text-xs text-slate-500 mt-0.5">&ge;50% passing cutoff</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      {filteredSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Students Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Top Performers Leaderboard</h3>
            <p className="text-xs text-slate-500 mb-4">Highest scoring students in this paper</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPerformersChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-200 text-xs">
                            <p className="font-bold text-slate-900">{data.fullName}</p>
                            <p className="text-slate-600">College: {data.college || 'N/A'}</p>
                            <p className="text-indigo-600 font-semibold mt-1">
                              Score: {data.score} marks ({data.percentage}%)
                            </p>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Student Submissions Directory</h3>
            <p className="text-xs text-slate-500">Comprehensive list of candidate attempts and contact records</p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name, college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">College</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-center">Percentage</th>
                <th className="py-2.5 px-3 text-center">Certificate</th>
                <th className="py-2.5 px-3 text-center">Tab Switches</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {searchedSubmissions.map((sub) => {
                const certInfo = (sub.student_data as any)?._certificate;
                const hasMarks = currentCert.minMarks > 0;
                const hasPercent = currentCert.minPercentage > 0;
                const satisfiesCutoff = currentCert.enabled && (
                  hasMarks && hasPercent
                    ? sub.total_score >= currentCert.minMarks || sub.percentage >= currentCert.minPercentage
                    : hasMarks
                    ? sub.total_score >= currentCert.minMarks
                    : hasPercent
                    ? sub.percentage >= currentCert.minPercentage
                    : true
                );
                const isEligible = certInfo?.issued || sub.certificate_issued || satisfiesCutoff;
                const certId = certInfo?.id || sub.certificate_id || (isEligible ? `A5-2026-${sub.id.substring(0, 6).toUpperCase()}` : '');

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-900">{sub.student_name}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {sub.student_college || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      <div>{sub.student_phone || '—'}</div>
                      <div className="text-[11px] text-slate-400">{sub.student_email || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {sub.total_score} / {sub.max_score}
                    </td>
                    <td className="py-3 px-3 text-center">
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
                    <td className="py-3 px-3 text-center">
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
                    <td className="py-3 px-3 text-center">
                      {sub.tab_switch_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          {sub.tab_switch_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
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

            <div className="pt-3 border-t border-slate-100 flex justify-end">
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
