import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== 'authenticated_token_a5') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { username, newPassword } = await request.json();

    if (!username || !newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters long.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();

    // Check if user exists in admins table, if not insert, else update
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('username', cleanUsername)
      .single();

    let error;
    if (existing) {
      const res = await supabase
        .from('admins')
        .update({ password_hash: newPassword })
        .eq('id', existing.id);
      error = res.error;
    } else {
      const res = await supabase
        .from('admins')
        .insert({
          username: cleanUsername,
          password_hash: newPassword,
          full_name: 'Administrator',
        });
      error = res.error;
    }

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully in database.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
