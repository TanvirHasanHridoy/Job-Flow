import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, userId: 'dev-master-tester' });
  
  response.cookies.set('jobmaster_dev_auth', 'dev-master-tester', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    httpOnly: false,
  });

  return response;
}
