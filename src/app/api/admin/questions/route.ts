import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Add Question
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paperId, questionText, questionType, topic, options = [], correctAnswers = [], marks = 1, negativeMarks = 0, explanation = '', orderIndex = 0 } = body;

    if (!paperId || !questionText) {
      return NextResponse.json({ success: false, error: 'Missing paper ID or question text' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        paper_id: paperId,
        question_text: questionText.trim(),
        question_type: questionType || 'single_choice',
        topic: topic?.trim() || 'General',
        options: options || [],
        correct_answers: correctAnswers || [],
        marks: Number(marks) || 1,
        negative_marks: Number(negativeMarks) || 0,
        explanation: explanation?.trim() || '',
        order_index: orderIndex || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// PUT: Edit Existing Question
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, questionText, questionType, topic, options = [], correctAnswers = [], marks = 1, negativeMarks = 0, explanation = '' } = body;

    if (!id || !questionText) {
      return NextResponse.json({ success: false, error: 'Missing question ID or text' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('questions')
      .update({
        question_text: questionText.trim(),
        question_type: questionType || 'single_choice',
        topic: topic?.trim() || 'General',
        options: options || [],
        correct_answers: correctAnswers || [],
        marks: Number(marks) || 1,
        negative_marks: Number(negativeMarks) || 0,
        explanation: explanation?.trim() || '',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// DELETE: Delete Question
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing question id' }, { status: 400 });
    }

    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
