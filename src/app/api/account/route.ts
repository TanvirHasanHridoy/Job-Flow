import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';

/**
 * Account data rights (v2 Phase 7.4, GDPR art. 15 / 17).
 *   GET    -> download everything JobFlow stores about the user (JSON)
 *   DELETE -> permanently delete the user's JobFlow data; body { confirm: "DELETE" }
 *
 * The sign-in identity itself lives in Supabase Auth and needs the service-role
 * key to delete; it is not removed here (the user is told so).
 */

const parse = (v: unknown) => {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
};

export async function GET() {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    const [profile, applications, tokens, logs] = await Promise.all([
      prisma.userProfile.findFirst({ where: { userId } }),
      prisma.jobApplication.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { documents: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
      }),
      prisma.userToken.findUnique({ where: { userId } }),
      prisma.tailorDiagnosticLog.findMany({ where: { userId }, orderBy: { timestamp: 'desc' } }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      profile: profile && {
        ...profile,
        workExperience: parse(profile.workExperience),
        education: parse(profile.education),
        skills: parse(profile.skills),
        languages: parse(profile.languages),
        projects: parse(profile.projects),
        customSections: parse(profile.customSections),
        personas: parse(profile.personas),
      },
      applications: applications.map(a => ({
        ...a,
        gapAnalysis: parse(a.gapAnalysis),
        documents: a.documents.map(d => ({ ...d, content: parse(d.content) })),
      })),
      tokens: tokens ? { balance: tokens.tokens, updatedAt: tokens.updatedAt } : null,
      aiLogs: logs.map(l => ({ ...l, rawLlmResponse: parse(l.rawLlmResponse) })),
    };

    const date = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="jobflow-data-${date}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Account export failed:', error);
    return NextResponse.json({ error: 'Your data could not be exported. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const logs = await tx.tailorDiagnosticLog.deleteMany({ where: { userId } });
      // Documents, status history and linked logs cascade with the application
      const applications = await tx.jobApplication.deleteMany({ where: { userId } });
      const profiles = await tx.userProfile.deleteMany({ where: { userId } });
      const tokens = await tx.userToken.deleteMany({ where: { userId } });
      return { logs: logs.count, applications: applications.count, profiles: profiles.count, tokens: tokens.count };
    });

    // Rate-limit counters (table may not exist before its migration)
    try {
      await prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "key" LIKE ${'%:' + userId}`;
    } catch { /* not migrated yet */ }

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return NextResponse.json({ error: 'Your data could not be deleted. Please try again or contact support.' }, { status: 500 });
  }
}
