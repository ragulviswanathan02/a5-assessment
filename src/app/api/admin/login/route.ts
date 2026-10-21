import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === correctPassword) {
      const response = NextResponse.json({ success: true, message: 'Logged in successfully' });
      // Set secure cookie for 7 days
      response.cookies.set('admin_session', 'authenticated_token_a5', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid admin password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
