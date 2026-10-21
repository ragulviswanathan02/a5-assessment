import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Please enter both username and password.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    let authenticated = false;
    let foundInDb = false;
    let adminFullName = 'Administrator';

    // 1. Check Supabase `admins` table
    try {
      const { data: adminUser, error: dbError } = await supabase
        .from('admins')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (!dbError && adminUser) {
        foundInDb = true;
        if (adminUser.password_hash === password || adminUser.password === password) {
          authenticated = true;
          adminFullName = adminUser.full_name || cleanUsername;
        }
      }
    } catch (dbErr) {
      console.warn('Database admin check skipped:', dbErr);
    }

    // 2. Only fallback if user is NOT registered in database table yet
    if (!foundInDb && !authenticated) {
      const fallbackPass = process.env.ADMIN_PASSWORD;
      if (fallbackPass && cleanUsername.toLowerCase() === 'admin' && password === fallbackPass) {
        authenticated = true;
      }
    }

    if (authenticated) {
      const response = NextResponse.json({
        success: true,
        message: 'Logged in successfully',
        user: { username: cleanUsername, fullName: adminFullName },
      });

      // Set secure admin session cookie for 7 days
      response.cookies.set('admin_session', 'authenticated_token_a5', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid username or password.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
