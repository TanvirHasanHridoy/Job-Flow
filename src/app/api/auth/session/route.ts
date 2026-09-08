import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const { userId } = auth;

    // Fetch user profile and token balance
    const [profile, tokenRecord] = await Promise.all([
      prisma.userProfile.findFirst({
        where: { userId },
        select: {
          fullName: true,
          email: true,
          personas: true
        }
      }),
      prisma.userToken.findFirst({
        where: { userId },
        select: { tokens: true }
      })
    ]);

    let personas: Array<{ id: string; name: string; isDefault?: boolean }> = [];
    if (profile?.personas) {
      try {
        personas = JSON.parse(profile.personas);
      } catch {
        personas = [];
      }
    }

    if (personas.length === 0) {
      personas = [{ id: 'default', name: 'Master Profile', isDefault: true }];
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        fullName: profile?.fullName || 'User',
        email: profile?.email || ''
      },
      personas,
      tokens: tokenRecord?.tokens ?? 200
    });
  } catch (error: any) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
