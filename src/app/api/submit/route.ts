import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { evaluateAssessment } from '@/lib/grading';
import { Question } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paperId, studentData, answers, tabSwitchCount = 0, timeTakenSeconds = 0 } = body;

    if (!paperId || !studentData) {
      return NextResponse.json(
        { success: false, error: 'Missing required submission fields' },
        { status: 400 }
      );
    }

    // 1. Fetch paper details
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .select('*')
      .eq('id', paperId)
      .single();

    if (paperError || !paper) {
      return NextResponse.json(
        { success: false, error: 'Question paper not found' },
        { status: 404 }
      );
    }

    // 2. Fetch all questions for this paper
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('paper_id', paperId)
      .order('order_index', { ascending: true });

    if (qError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assessment questions' },
        { status: 500 }
      );
    }

    // 3. Grade the assessment
    const grading = evaluateAssessment((questions || []) as Question[], answers || {});

    // 4. Extract common student fields
    const studentName =
      studentData.full_name ||
      studentData.name ||
      studentData.student_name ||
      Object.values(studentData)[0] ||
      'Anonymous Student';

    const studentEmail =
      studentData.email ||
      studentData.email_address ||
      studentData.mail ||
      '';

    const studentPhone =
      studentData.phone ||
      studentData.phone_number ||
      studentData.mobile ||
      '';

    const studentCollege =
      studentData.college ||
      studentData.college_name ||
      studentData.institution ||
      '';

    const cleanEmail = String(studentEmail || '').trim().toLowerCase();
    const cleanPhone = String(studentPhone || '').trim();

    // Prevent duplicate attempts / retakes for the same test paper
    if (cleanEmail) {
      const { data: existingEmail } = await supabase
        .from('submissions')
        .select('id')
        .eq('paper_id', paperId)
        .ilike('student_email', cleanEmail)
        .limit(1);

      if (existingEmail && existingEmail.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'An assessment has already been submitted with this email address. Duplicate retakes are not allowed.',
          },
          { status: 403 }
        );
      }
    }

    if (cleanPhone) {
      const { data: existingPhone } = await supabase
        .from('submissions')
        .select('id')
        .eq('paper_id', paperId)
        .eq('student_phone', cleanPhone)
        .limit(1);

      if (existingPhone && existingPhone.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'An assessment has already been submitted with this phone number. Duplicate retakes are not allowed.',
          },
          { status: 403 }
        );
      }
    }

    const safeTabSwitches = Math.max(0, Math.floor(Number(tabSwitchCount) || 0));
    const safeTimeTaken = Math.max(0, Math.floor(Number(timeTakenSeconds) || 0));

    // 4.5. Certificate Qualification Evaluation
    let certConfig = {
      enabled: !!(paper as any).certificate_enabled,
      minMarks:
        (paper as any).certificate_min_marks !== undefined && (paper as any).certificate_min_marks !== null
          ? Number((paper as any).certificate_min_marks)
          : 10,
      minPercentage:
        (paper as any).certificate_min_percentage !== undefined && (paper as any).certificate_min_percentage !== null
          ? Number((paper as any).certificate_min_percentage)
          : 0,
      title: (paper as any).certificate_title || paper.title || 'Industrial Automation Skill Training Program',
      signatory: (paper as any).certificate_signatory || 'Director',
      signatoryTitle: (paper as any).certificate_signatory_title || 'A5 Automation',
    };

    if (paper.description && paper.description.includes('[CERT_CFG:')) {
      try {
        const match = paper.description.match(/\[CERT_CFG:(.*?)\]/);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          if (parsed.enabled !== undefined) certConfig.enabled = !!parsed.enabled;
          if (parsed.minMarks !== undefined && parsed.minMarks !== null) certConfig.minMarks = Number(parsed.minMarks);
          if (parsed.minPercentage !== undefined && parsed.minPercentage !== null) certConfig.minPercentage = Number(parsed.minPercentage);
          if (parsed.title) certConfig.title = parsed.title;
          if (parsed.signatory) certConfig.signatory = parsed.signatory;
          if (parsed.signatoryTitle) certConfig.signatoryTitle = parsed.signatoryTitle;
        }
      } catch (e) {}
    }

    const hasMarksCriteria = certConfig.minMarks > 0;
    const hasPercentCriteria = certConfig.minPercentage > 0;

    const isQualified =
      certConfig.enabled &&
      (
        hasMarksCriteria && hasPercentCriteria
          ? grading.totalScore >= certConfig.minMarks || grading.percentage >= certConfig.minPercentage
          : hasMarksCriteria
          ? grading.totalScore >= certConfig.minMarks
          : hasPercentCriteria
          ? grading.percentage >= certConfig.minPercentage
          : true
      );

    let certId = '';
    let certInfo: any = null;

    if (isQualified) {
      certId = 'A5-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      certInfo = {
        issued: true,
        id: certId,
        studentName: String(studentName),
        studentCollege: String(studentCollege),
        paperTitle: certConfig.title,
        score: grading.totalScore,
        maxScore: grading.maxScore,
        percentage: grading.percentage,
        minPercentage: certConfig.minPercentage || 70,
        minMarks: certConfig.minMarks || 0,
        issueDate: new Date().toISOString(),
        signatory: certConfig.signatory,
        signatoryTitle: certConfig.signatoryTitle,
      };
    }

    // Enrich studentData with certificate info (guaranteed to persist in JSONB)
    const enrichedStudentData = {
      ...studentData,
      _certificate: certInfo || {
        issued: false,
        minMarks: certConfig.minMarks,
        minPercentage: certConfig.minPercentage,
        enabled: certConfig.enabled,
      },
    };

    // 5. Store submission in Supabase
    let submission: any = null;
    let subError: any = null;

    // Try inserting with dedicated certificate columns first
    const insertRes1 = await supabase
      .from('submissions')
      .insert({
        paper_id: paperId,
        student_name: String(studentName),
        student_email: String(studentEmail),
        student_phone: String(studentPhone),
        student_college: String(studentCollege),
        student_data: enrichedStudentData,
        answers: answers || {},
        total_score: grading.totalScore,
        max_score: grading.maxScore,
        percentage: grading.percentage,
        topic_scores: grading.topicScores,
        tab_switch_count: safeTabSwitches,
        time_taken_seconds: safeTimeTaken,
        certificate_issued: isQualified,
        certificate_id: certId || null,
      })
      .select()
      .single();

    if (!insertRes1.error) {
      submission = insertRes1.data;
    } else {
      // Fallback insert without dedicated certificate columns (data is safely in student_data)
      const insertRes2 = await supabase
        .from('submissions')
        .insert({
          paper_id: paperId,
          student_name: String(studentName),
          student_email: String(studentEmail),
          student_phone: String(studentPhone),
          student_college: String(studentCollege),
          student_data: enrichedStudentData,
          answers: answers || {},
          total_score: grading.totalScore,
          max_score: grading.maxScore,
          percentage: grading.percentage,
          topic_scores: grading.topicScores,
          tab_switch_count: safeTabSwitches,
          time_taken_seconds: safeTimeTaken,
        })
        .select()
        .single();

      submission = insertRes2.data;
      subError = insertRes2.error;
    }

    if (subError || !submission) {
      console.error('Error recording submission:', subError);
      return NextResponse.json(
        { success: false, error: 'Failed to record student submission: ' + (subError?.message || '') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      showResultsImmediately: paper.show_results_immediately,
      certificateEligible: isQualified,
      certificate: certInfo,
      result: {
        totalScore: grading.totalScore,
        maxScore: grading.maxScore,
        percentage: grading.percentage,
        topicScores: paper.show_results_immediately ? grading.topicScores : {},
        certificate: certInfo,
      },
    });
  } catch (error: any) {
    console.error('Submission API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
