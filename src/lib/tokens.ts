import { prisma } from './prisma';

export const TOKEN_PRICING = {
  TAILOR: 20,          // /api/tailor
  IMPORT_PROFILE: 30,  // /api/import-profile & /api/profile/import-pdf
  INTAKE: 5,           // /api/intake/parse-job-pdf & /api/intake/scrape-url
  REGENERATE_SECTION: 5, // /api/tailor/section
  POLISH_BULLET: 2,    // /api/tailor/section (single bullet)
} as const;

/**
 * Retrieves the user's token balance. 
 * Automatically initializes new users with 200 tokens if no record exists.
 */
export async function getUserTokens(userId: string): Promise<number> {
  const record = await prisma.userToken.upsert({
    where: { userId },
    update: {},
    create: { userId, tokens: 200 }
  });
  return record.tokens;
}

/**
 * Deducts the specified amount of tokens from the user's balance.
 * Returns whether deduction succeeded and the new token balance.
 */
export async function deductTokens(
  userId: string, 
  amount: number
): Promise<{ success: boolean; tokens: number }> {
  return await prisma.$transaction(async (tx) => {
    let record = await tx.userToken.findUnique({
      where: { userId }
    });

    if (!record) {
      record = await tx.userToken.create({
        data: { userId, tokens: 200 }
      });
    }

    if (record.tokens < amount) {
      return { success: false, tokens: record.tokens };
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
 * Tops up the user's token balance by the specified amount.
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
      tokens: 200 + amount
    }
  });
  return record.tokens;
}
