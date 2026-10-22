import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

// Helper to embed certificate config into description safely
function buildDescriptionWithCert(cleanDesc: string, certConfig: any): string {
  const descWithoutOldConfig = cleanDesc.replace(/\[CERT_CFG:[\s\S]*?\]/, '').trim();
  const certTag = `[CERT_CFG:${JSON.stringify(certConfig)}]`;
  return descWithoutOldConfig ? `${descWithoutOldConfig}\n\n${certTag}` : certTag;
}

// POST: Create Paper
export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description = '',
      durationMinutes = 30,
      isActive = false,
      showResultsImmediately = true,
      trackTabSwitches = true,
      certificateEnabled = false,
      certificateMinMarks = 10,
      certificateMinPercentage = 60,
      certificateTitle = '',
      certificateSignatory = 'Director',
      certificateSignatoryTitle = 'A5 Automation',
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const certConfig = {
      enabled: !!certificateEnabled,
      minMarks: Number(certificateMinMarks) || 10,
      minPercentage: Number(certificateMinPercentage) || 60,
      title: certificateTitle.trim() || title.trim(),
      signatory: certificateSignatory.trim() || 'Director',
      signatoryTitle: certificateSignatoryTitle.trim() || 'A5 Automation',
    };

    const finalDescription = buildDescriptionWithCert(description.trim(), certConfig);

    // Try inserting with dedicated columns first
    let newPaper: any = null;
    let pError: any = null;

    const res1 = await supabase
      .from('papers')
      .insert({
        title: title.trim(),
        description: finalDescription,
        duration_minutes: Number(durationMinutes) || 0,
        is_active: isActive,
        show_results_immediately: showResultsImmediately,
        track_tab_switches: trackTabSwitches,
        certificate_enabled: certConfig.enabled,
        certificate_min_marks: certConfig.minMarks,
        certificate_min_percentage: certConfig.minPercentage,
        certificate_title: certConfig.title,
        certificate_signatory: certConfig.signatory,
        certificate_signatory_title: certConfig.signatoryTitle,
      })
      .select()
      .single();

    if (!res1.error) {
      newPaper = res1.data;
    } else {
      // Fallback insert without dedicated certificate columns (safe via description embedding)
      const res2 = await supabase
        .from('papers')
        .insert({
          title: title.trim(),
          description: finalDescription,
          duration_minutes: Number(durationMinutes) || 0,
          is_active: isActive,
          show_results_immediately: showResultsImmediately,
          track_tab_switches: trackTabSwitches,
        })
        .select()
        .single();

      newPaper = res2.data;
      pError = res2.error;
    }

    if (pError || !newPaper) {
      return NextResponse.json({ success: false, error: pError?.message || 'Failed to create paper' }, { status: 500 });
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

// PUT: Update Paper & Certificate Settings
export async function PUT(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      description = '',
      durationMinutes = 30,
      showResultsImmediately = true,
      trackTabSwitches = true,
      certificateEnabled = false,
      certificateMinMarks = 10,
      certificateMinPercentage = 60,
      certificateTitle = '',
      certificateSignatory = 'Director',
      certificateSignatoryTitle = 'A5 Automation',
    } = body;

    if (!id || !title) {
      return NextResponse.json({ success: false, error: 'Paper ID and Title are required' }, { status: 400 });
    }

    const certConfig = {
      enabled: !!certificateEnabled,
      minMarks: Number(certificateMinMarks) || 10,
      minPercentage: Number(certificateMinPercentage) || 60,
      title: certificateTitle.trim() || title.trim(),
      signatory: certificateSignatory.trim() || 'Director',
      signatoryTitle: certificateSignatoryTitle.trim() || 'A5 Automation',
    };

    const finalDescription = buildDescriptionWithCert(description.trim(), certConfig);

    // Try updating with dedicated columns
    let updated: any = null;
    let upError: any = null;

    const res1 = await supabase
      .from('papers')
      .update({
        title: title.trim(),
        description: finalDescription,
        duration_minutes: Number(durationMinutes) || 0,
        show_results_immediately: showResultsImmediately,
        track_tab_switches: trackTabSwitches,
        certificate_enabled: certConfig.enabled,
        certificate_min_marks: certConfig.minMarks,
        certificate_min_percentage: certConfig.minPercentage,
        certificate_title: certConfig.title,
        certificate_signatory: certConfig.signatory,
        certificate_signatory_title: certConfig.signatoryTitle,
      })
      .eq('id', id)
      .select()
      .single();

    if (!res1.error) {
      updated = res1.data;
    } else {
      // Fallback update without dedicated certificate columns
      const res2 = await supabase
        .from('papers')
        .update({
          title: title.trim(),
          description: finalDescription,
          duration_minutes: Number(durationMinutes) || 0,
          show_results_immediately: showResultsImmediately,
          track_tab_switches: trackTabSwitches,
        })
        .eq('id', id)
        .select()
        .single();

      updated = res2.data;
      upError = res2.error;
    }

    if (upError || !updated) {
      return NextResponse.json({ success: false, error: upError?.message || 'Failed to update paper' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
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
