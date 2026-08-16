import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        documents: true,
        statusHistory: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...application,
      gapAnalysis: JSON.parse(application.gapAnalysis)
    });
  } catch (error: any) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // 1. Get original application to check current status
    const existingApp = await prisma.jobApplication.findUnique({
      where: { id }
    });

    if (!existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // 2. Prepare update data
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
    if (body.techStack !== undefined) data.techStack = body.techStack;
    if (body.mainRequirements !== undefined) data.mainRequirements = body.mainRequirements;
    if (body.recruiterName !== undefined) data.recruiterName = body.recruiterName;
    if (body.contactInfo !== undefined) data.contactInfo = body.contactInfo;
    if (body.jobType !== undefined) data.jobType = body.jobType;
    if (body.location !== undefined) data.location = body.location;
    if (body.remoteOrPhysical !== undefined) data.remoteOrPhysical = body.remoteOrPhysical;

    // Run within a transaction
    const updatedApplication = await prisma.$transaction(async (tx) => {
      // 3. Log status history if status changed
      if (body.status !== undefined && body.status !== existingApp.status) {
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: id,
            fromStatus: existingApp.status,
            toStatus: body.status
          }
        });
      }

      // 4. Update documents if provided — upsert by type, never wipe unrelated docs
      if (body.documents !== undefined) {
        for (const doc of body.documents) {
          const existing = await tx.generatedDocument.findFirst({
            where: { applicationId: id, type: doc.type }
          });
          const content = typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content);
          if (existing) {
            await tx.generatedDocument.update({
              where: { id: existing.id },
              data: { content }
            });
          } else {
            await tx.generatedDocument.create({
              data: { applicationId: id, type: doc.type, content }
            });
          }
        }
      }

      // 5. Update main application record
      return await tx.jobApplication.update({
        where: { id },
        data,
        include: { 
          documents: true,
          statusHistory: { orderBy: { createdAt: 'desc' } }
        }
      });
    });

    return NextResponse.json({
      ...updatedApplication,
      gapAnalysis: JSON.parse(updatedApplication.gapAnalysis)
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

