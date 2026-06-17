import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // We only update matching fields in the request
    const data: any = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.company !== undefined) data.company = body.company;
    if (body.role !== undefined) data.role = body.role;
    if (body.salaryExpectation !== undefined) data.salaryExpectation = body.salaryExpectation;
    if (body.noticePeriod !== undefined) data.noticePeriod = body.noticePeriod;
    if (body.signingLocation !== undefined) data.signingLocation = body.signingLocation;
    if (body.customNotes !== undefined) data.customNotes = body.customNotes;
    if (body.matchScore !== undefined) data.matchScore = body.matchScore;
    if (body.gapAnalysis !== undefined) data.gapAnalysis = JSON.stringify(body.gapAnalysis);

    const application = await prisma.jobApplication.update({
      where: { id },
      data,
      include: { documents: true }
    });

    return NextResponse.json({
      ...application,
      gapAnalysis: JSON.parse(application.gapAnalysis)
    });
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.jobApplication.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
