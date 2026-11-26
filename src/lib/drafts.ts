import { prisma } from './prisma';

/**
 * Draft applications (v2 Phase 4).
 *
 * Every successful generation is saved immediately as a JobApplication with
 * status DRAFT, so a paid result survives a closed tab. Drafts are hidden from
 * the tracker until the user clicks "Track" (status -> TAILORED). Drafts that are
 * never tracked are deleted after DRAFT_RETENTION_DAYS (owner decision).
 */

export const DRAFT_STATUS = 'DRAFT';
export const DRAFT_RETENTION_DAYS = 30;

export async function saveDraftApplication(userId: string, input: {
  company: string;
  role: string;
  rawJobDescription: string;
  targetLanguage: string;
  matchScore: number;
  gapAnalysis: unknown;
  jobMetadata?: Record<string, any>;
  salaryExpectation?: string;
  noticePeriod?: string;
  signingLocation?: string;
  customNotes?: string;
  tailoredCv: unknown;
  tailoredCoverLetter?: unknown;
}): Promise<string> {
  const meta = input.jobMetadata || {};
  const clean = (v: unknown) => (typeof v === 'string' && v !== 'Not specified' ? v : '');
  const app = await prisma.jobApplication.create({
    data: {
      userId,
      company: input.company || 'Target Company',
      role: input.role || 'Target Role',
      status: DRAFT_STATUS,
      rawJobDescription: input.rawJobDescription,
      targetLanguage: input.targetLanguage || 'EN',
      matchScore: Math.round(input.matchScore || 0),
      gapAnalysis: JSON.stringify(input.gapAnalysis || {}),
      salaryExpectation: input.salaryExpectation || null,
      noticePeriod: input.noticePeriod || null,
      signingLocation: input.signingLocation || null,
      customNotes: input.customNotes || null,
      techStack: clean(meta.techStack),
      mainRequirements: clean(meta.mainRequirements),
      recruiterName: clean(meta.recruiterName),
      contactInfo: clean(meta.contactInfo),
      jobType: clean(meta.jobType),
      location: clean(meta.location),
      remoteOrPhysical: clean(meta.remoteOrPhysical),
      documents: {
        create: [
          { type: 'CV', content: JSON.stringify(input.tailoredCv) },
          ...(input.tailoredCoverLetter ? [{ type: 'COVER_LETTER', content: JSON.stringify(input.tailoredCoverLetter) }] : []),
        ],
      },
    },
    select: { id: true },
  });
  return app.id;
}

/** True if the draft still exists for this user (it may have been tracked or deleted). */
export async function isLiveDraft(userId: string, id: unknown): Promise<boolean> {
  if (typeof id !== 'string' || !id) return false;
  const found = await prisma.jobApplication.findFirst({ where: { id, userId, status: DRAFT_STATUS }, select: { id: true } });
  return !!found;
}

/** Deletes this user's drafts not touched for DRAFT_RETENTION_DAYS. Never throws. */
export async function cleanupOldDrafts(userId: string): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - DRAFT_RETENTION_DAYS * 86400 * 1000);
    const { count } = await prisma.jobApplication.deleteMany({
      where: { userId, status: DRAFT_STATUS, updatedAt: { lt: cutoff } },
    });
    return count;
  } catch (err) {
    console.error('Draft cleanup failed:', err);
    return 0;
  }
}
