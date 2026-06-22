import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getUserTokens } from '@/lib/tokens';

export async function GET() {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    const tokens = await getUserTokens(userId);
    return NextResponse.json({ tokens });
  } catch (error: any) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}
