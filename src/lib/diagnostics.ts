import crypto from 'crypto';
import { prisma } from './prisma';

/**
 * Tailoring diagnostics with data minimisation (v2 Phase 7.4, owner decision: 30 days).
 *
 * - The full system prompt and the user's profile are NOT stored any more —
 *   only a fingerprint (hash + size), enough to tell which prompt version or
 *   profile state produced a result.
 * - The job description and raw AI response are kept for debugging, and every
 *   log row is deleted after LOG_RETENTION_DAYS.
 */
export const LOG_RETENTION_DAYS = 30;

const fingerprint = (value: string) =>
  `sha256:${crypto.createHash('sha256').update(value).digest('hex').slice(0, 16)} chars:${value.length}`;

export async function logTailorDiagnostic(input: {
  userId: string;
  applicationId?: string | null;
  rawJobDescription: string;
  profileSnapshot: unknown;
  matchStrategy: string;
  systemPrompt: string;
  rawResponse: string;
}): Promise<void> {
  try {
    // Only link applications this user owns (the id comes from the client)
    let applicationId: string | null = null;
    if (typeof input.applicationId === 'string' && input.applicationId) {
      const owned = await prisma.jobApplication.findFirst({ where: { id: input.applicationId, userId: input.userId }, select: { id: true } });
      applicationId = owned ? owned.id : null;
    }
    await prisma.tailorDiagnosticLog.create({
      data: {
        userId: input.userId,
        applicationId,
        rawJobDescription: input.rawJobDescription,
        userProfileSnapshot: JSON.stringify({ omitted: true, fingerprint: fingerprint(JSON.stringify(input.profileSnapshot ?? null)) }),
        matchStrategyUsed: input.matchStrategy,
        systemPromptSent: `[omitted] ${fingerprint(input.systemPrompt)}`,
        rawLlmResponse: input.rawResponse,
      },
    });
  } catch (err) {
    console.error('Failed to create diagnostic log entry:', err);
  }
  void purgeOldDiagnostics(input.userId);
}

/** Deletes this user's logs older than the retention period; occasionally sweeps everyone's. Never throws. */
export async function purgeOldDiagnostics(userId?: string): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 86400 * 1000);
    if (userId) {
      await prisma.tailorDiagnosticLog.deleteMany({ where: { userId, timestamp: { lt: cutoff } } });
    }
    if (!userId || Math.random() < 0.05) {
      await prisma.tailorDiagnosticLog.deleteMany({ where: { timestamp: { lt: cutoff } } });
    }
  } catch (err) {
    console.error('Diagnostic log cleanup failed:', err);
  }
}
