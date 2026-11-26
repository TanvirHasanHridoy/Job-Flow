import { NextResponse } from 'next/server';
import { prisma } from './prisma';

/**
 * Per-user fixed-window rate limiting for expensive routes (AI calls, exports).
 *
 * Counters live in the "RateLimitBucket" Postgres table so limits hold across
 * server instances. If that table is missing (migration not yet applied) or the
 * database errors, it falls back to an in-memory counter for this instance, so
 * the app keeps working and is still protected per instance.
 */

export const RATE_LIMITS = {
  TAILOR: { limit: 15, windowSec: 3600 },          // full CV + cover letter generations
  SECTION: { limit: 60, windowSec: 3600 },         // section regenerate / bullet polish
  OUTREACH: { limit: 20, windowSec: 3600 },
  INTERVIEW_PREP: { limit: 20, windowSec: 3600 },
  IMPORT_PROFILE: { limit: 10, windowSec: 3600 },  // GitHub/LinkedIn/PDF profile import
  INTAKE: { limit: 30, windowSec: 3600 },          // job URL scrape / job PDF parse
  EXPORT: { limit: 60, windowSec: 3600 },          // PDF / DOCX export
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

type Result = { allowed: boolean; remaining: number; retryAfterSec: number };

const memoryCounters = new Map<string, number>();
let warnedFallback = false;

function windowStartFor(windowSec: number, now = Date.now()): Date {
  return new Date(Math.floor(now / (windowSec * 1000)) * windowSec * 1000);
}

async function incrementInDb(key: string, windowStart: Date): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart")
    DO UPDATE SET "count" = "RateLimitBucket"."count" + 1
    RETURNING "count"`;
  // Occasionally purge expired windows so the table stays small.
  if (Math.random() < 0.01) {
    prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "windowStart" < ${new Date(Date.now() - 2 * 86400 * 1000)}`
      .catch(() => {});
  }
  return Number(rows[0]?.count ?? 1);
}

function incrementInMemory(key: string, windowStart: Date): number {
  const memKey = `${key}@${windowStart.getTime()}`;
  const next = (memoryCounters.get(memKey) ?? 0) + 1;
  memoryCounters.set(memKey, next);
  if (memoryCounters.size > 10000) {
    const cutoff = Date.now() - 2 * 86400 * 1000;
    for (const k of memoryCounters.keys()) {
      if (Number(k.split('@').pop()) < cutoff) memoryCounters.delete(k);
    }
  }
  return next;
}

export async function checkRateLimit(userId: string, bucket: RateLimitBucket): Promise<Result> {
  const { limit, windowSec } = RATE_LIMITS[bucket];
  const windowStart = windowStartFor(windowSec);
  const key = `${bucket}:${userId}`;

  let count: number;
  try {
    count = await incrementInDb(key, windowStart);
  } catch (err) {
    if (!warnedFallback) {
      warnedFallback = true;
      console.warn('[rateLimit] Falling back to in-memory counters (apply the RateLimitBucket migration):', (err as Error).message?.split('\n').pop());
    }
    count = incrementInMemory(key, windowStart);
  }

  const retryAfterSec = Math.max(1, Math.ceil((windowStart.getTime() + windowSec * 1000 - Date.now()) / 1000));
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfterSec };
}

/**
 * Returns a 429 response when the user is over the limit, otherwise null.
 */
export async function enforceRateLimit(userId: string, bucket: RateLimitBucket): Promise<NextResponse | null> {
  const result = await checkRateLimit(userId, bucket);
  if (result.allowed) return null;
  const minutes = Math.ceil(result.retryAfterSec / 60);
  return NextResponse.json(
    { error: `You've reached the limit for this action. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.` },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSec) } }
  );
}
