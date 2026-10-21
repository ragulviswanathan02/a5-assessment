import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Add new form field
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paperId, fieldKey, label, fieldType, options = [], isRequired = true, orderIndex = 0 } = body;

    if (!paperId || !label) {
      return NextResponse.json(
        { success: false, error: 'Missing paper ID or field label' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('form_fields')
      .insert({
        paper_id: paperId,
        field_key: fieldKey || label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4),
        label: label.trim(),
        field_type: fieldType || 'text',
        options: options || [],
        is_required: isRequired ?? true,
        order_index: orderIndex || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding field to Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Server error in form-fields POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// PUT: Edit existing form field
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, label, fieldType, options = [], isRequired } = body;

    if (!id || !label) {
      return NextResponse.json(
        { success: false, error: 'Missing field ID or label' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('form_fields')
      .update({
        label: label.trim(),
        field_type: fieldType,
        options: options || [],
        is_required: isRequired ?? true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating field:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// PATCH: Toggle is_required or order
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isRequired } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing field ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('form_fields')
      .update({ is_required: isRequired })
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

// DELETE: Remove form field
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing field ID' }, { status: 400 });
    }

    const { error } = await supabase.from('form_fields').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
