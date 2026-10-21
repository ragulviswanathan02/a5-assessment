import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch predefined topics
export async function GET() {
  try {
    // 1. Try from topics table if exists
    const { data: dbTopics, error: dbErr } = await supabase
      .from('topics')
      .select('name')
      .order('name', { ascending: true });

    if (!dbErr && dbTopics && dbTopics.length > 0) {
      return NextResponse.json({
        success: true,
        topics: dbTopics.map((t) => t.name),
      });
    }

    // 2. Return clean default list (no automatic re-injection of old CSE topics)
    return NextResponse.json({
      success: true,
      topics: ['General', 'Aptitude'],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add new predefined topic
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Topic name required' }, { status: 400 });
    }

    const cleanName = name.trim();

    // Try inserting into topics table
    const { data, error } = await supabase
      .from('topics')
      .insert({ name: cleanName })
      .select()
      .single();

    if (error) {
      // Table may not exist; client localStorage also persists it
      return NextResponse.json({ success: true, name: cleanName, note: error.message });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete predefined topic
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ success: false, error: 'Topic name required' }, { status: 400 });
    }

    await supabase.from('topics').delete().eq('name', name);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
