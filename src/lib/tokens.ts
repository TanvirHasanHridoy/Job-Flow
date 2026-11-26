import { prisma } from './prisma';

export const TOKEN_PRICING = {
  TAILOR: 20,          // /api/tailor
  IMPORT_PROFILE: 30,  // /api/import-profile & /api/profile/import-pdf
  INTAKE: 5,           // /api/intake/parse-job-pdf & /api/intake/scrape-url (AI path only)
  REGENERATE_SECTION: 5, // /api/tailor/section
  POLISH_BULLET: 2,    // /api/tailor/section (single bullet)
  OUTREACH: 5,         // /api/tailor/outreach
  INTERVIEW_PREP: 5,   // /api/tailor/interview-prep
} as const;

/**
 * Free plan (owner decision, v2 Phase 7): 100 tokens per calendar month.
 * At the first activity of a new month (UTC) the balance is raised back to 100.
 * It does not accumulate, and a higher balance (e.g. an admin grant) is kept.
 */
export const FREE_MONTHLY_TOKENS = 100;

let warnedMissingRefillColumn = false;

/**
 * Applies the monthly refill if this user hasn't had one this month. Atomic and
 * idempotent (single UPDATE). Uses raw SQL so the app keeps working before the
 * "lastRefillAt" migration is applied (then refills are simply skipped).
 */
export async function applyMonthlyRefill(userId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "UserToken"
      SET "tokens" = GREATEST("tokens", ${FREE_MONTHLY_TOKENS}), "lastRefillAt" = NOW()
      WHERE "userId" = ${userId}
        AND ("lastRefillAt" IS NULL OR "lastRefillAt" < date_trunc('month', NOW() AT TIME ZONE 'UTC'))`;
  } catch (err) {
    if (!warnedMissingRefillColumn) {
      warnedMissingRefillColumn = true;
      console.warn('[tokens] Monthly refill skipped (apply the UserToken.lastRefillAt migration):', (err as Error).message?.split('\n').pop());
    }
  }
}

/** Next refill date (first day of next month, UTC) — for UI messages. */
export function nextRefillDate(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/**
 * Retrieves the user's token balance, creating new users with the free monthly
 * allowance and applying the monthly refill when due.
 */
export async function getUserTokens(userId: string): Promise<number> {
  await prisma.userToken.upsert({
    where: { userId },
    update: {},
    create: { userId, tokens: FREE_MONTHLY_TOKENS }
  });
  await applyMonthlyRefill(userId);
  const record = await prisma.userToken.findUnique({ where: { userId } });
  return record?.tokens ?? FREE_MONTHLY_TOKENS;
}

/**
 * Deducts the specified amount of tokens from the user's balance.
 * Returns whether deduction succeeded and the new token balance.
 */
export async function deductTokens(
  userId: string,
  amount: number
): Promise<{ success: boolean; tokens: number }> {
  // Make sure this month's refill is in place before checking the balance
  await prisma.userToken.upsert({
    where: { userId },
    update: {},
    create: { userId, tokens: FREE_MONTHLY_TOKENS }
  });
  await applyMonthlyRefill(userId);

  return await prisma.$transaction(async (tx) => {
    const record = await tx.userToken.findUnique({
      where: { userId }
    });

    if (!record || record.tokens < amount) {
      return { success: false, tokens: record?.tokens ?? 0 };
    }

    const updated = await tx.userToken.update({
      where: { userId },
      data: {
        tokens: {
          decrement: amount
        }
      }
    });

    return { success: true, tokens: updated.tokens };
  });
}

/**
 * Tops up the user's token balance by the specified amount (refunds, admin grants).
 */
export async function topUpTokens(userId: string, amount: number): Promise<number> {
  const record = await prisma.userToken.upsert({
    where: { userId },
    update: {
      tokens: {
        increment: amount
      }
    },
    create: {
      userId,
      tokens: FREE_MONTHLY_TOKENS + amount
    }
  });
  return record.tokens;
}
