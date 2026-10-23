import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

// DELETE: Delete a student submission record
export async function DELETE(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing submission ID' }, { status: 400 });
    }

    const { error } = await supabase.from('submissions').delete().eq('id', id);

    if (error) {
      console.error('Error deleting submission:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error: any) {
    console.error('Submission delete error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
