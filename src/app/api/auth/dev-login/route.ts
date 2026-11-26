import { NextResponse } from 'next/server';
import { DEV_AUTH_COOKIE, isDevAuthEnabled } from '@/lib/devAuth';

export async function POST() {
  // Never available in production: it would let anyone sign in without OAuth.
  if (!isDevAuthEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const response = NextResponse.json({ success: true, userId: 'dev-master-tester' });

  response.cookies.set(DEV_AUTH_COOKIE, 'dev-master-tester', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    httpOnly: false,
  });

  return response;
}
