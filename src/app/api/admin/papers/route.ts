import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

// POST: Create Paper
export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description = '', durationMinutes = 30, isActive = false, showResultsImmediately = true, trackTabSwitches = true } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const { data: newPaper, error } = await supabase
      .from('papers')
      .insert({
        title: title.trim(),
        description: description.trim(),
        duration_minutes: Number(durationMinutes) || 0,
        is_active: isActive,
        show_results_immediately: showResultsImmediately,
        track_tab_switches: trackTabSwitches,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Insert default profile fields
    await supabase.from('form_fields').insert([
      { paper_id: newPaper.id, field_key: 'full_name', label: 'Full Name', field_type: 'text', options: [], is_required: true, order_index: 1 },
      { paper_id: newPaper.id, field_key: 'email', label: 'Email Address', field_type: 'email', options: [], is_required: true, order_index: 2 },
      { paper_id: newPaper.id, field_key: 'phone', label: 'Phone Number', field_type: 'tel', options: [], is_required: true, order_index: 3 },
      { paper_id: newPaper.id, field_key: 'college', label: 'College Name', field_type: 'dropdown', options: ['CEG Anna University', 'PSG College of Technology', 'MIT Chennai', 'SSN College of Engineering', 'Nandha Engineering College', 'Other'], is_required: true, order_index: 4 },
    ]);

    return NextResponse.json({ success: true, data: newPaper });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// PATCH: Set Active Paper
export async function PATCH(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const { paperId } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, error: 'Missing paperId' }, { status: 400 });
    }

    // Deactivate all
    await supabase.from('papers').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    // Activate target
    const { data, error } = await supabase.from('papers').update({ is_active: true }).eq('id', paperId).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// DELETE: Delete paper
export async function DELETE(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing paper id' }, { status: 400 });
    }

    const { error } = await supabase.from('papers').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
