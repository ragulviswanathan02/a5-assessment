import { cookies } from 'next/headers';

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    return !!session && session.value === 'authenticated_token_a5';
  } catch (e) {
    return false;
  }
}
