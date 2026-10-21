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

    // 5. Store submission in Supabase
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .insert({
        paper_id: paperId,
        student_name: String(studentName),
        student_email: String(studentEmail),
        student_phone: String(studentPhone),
        student_college: String(studentCollege),
        student_data: studentData,
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

    if (subError) {
      console.error('Error recording submission:', subError);
      return NextResponse.json(
        { success: false, error: 'Failed to record student submission: ' + subError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      showResultsImmediately: paper.show_results_immediately,
      result: paper.show_results_immediately
        ? {
            totalScore: grading.totalScore,
            maxScore: grading.maxScore,
            percentage: grading.percentage,
            topicScores: grading.topicScores,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Submission API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
