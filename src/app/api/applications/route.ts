import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const applications = await prisma.jobApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { documents: true }
    });

    const parsedApplications = applications.map((app) => ({
      ...app,
      gapAnalysis: JSON.parse(app.gapAnalysis)
    }));

    return NextResponse.json(parsedApplications);
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      company,
      role,
      status = 'TAILORED',
      salaryExpectation,
      noticePeriod,
      signingLocation,
      customNotes,
      rawJobDescription,
      matchScore = 0,
      gapAnalysis = {},
      targetLanguage,
      documents = [] // [{ type: 'CV' | 'COVER_LETTER', content: string }]
    } = body;

    if (!company || !role || !rawJobDescription || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const application = await prisma.jobApplication.create({
      data: {
        company,
        role,
        status,
        salaryExpectation,
        noticePeriod,
        signingLocation,
        customNotes,
        rawJobDescription,
        matchScore,
        gapAnalysis: JSON.stringify(gapAnalysis),
        targetLanguage,
        documents: {
          create: documents.map((doc: any) => ({
            type: doc.type,
            content: typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content)
          }))
        }
      },
      include: {
        documents: true
      }
    });

    return NextResponse.json({
      ...application,
      gapAnalysis: JSON.parse(application.gapAnalysis)
    });
  } catch (error: any) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
