#!/usr/bin/env node
/**
 * Admin: grant tokens to a user (v2 Phase 7).
 *
 *   npm run tokens:add -- <userId | profile email> <amount>
 *   npm run tokens:add -- 3f2c...-uuid 100
 *   npm run tokens:add -- lena@example.com 50
 *
 * Runs locally against DATABASE_URL from .env; there is no web endpoint for this.
 * A negative amount removes tokens (never below 0).
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const [who, rawAmount] = process.argv.slice(2);
  const amount = Number(rawAmount);
  if (!who || !Number.isInteger(amount) || amount === 0) {
    console.error('Usage: npm run tokens:add -- <userId | profile email> <amount>');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    let userId = who;
    if (who.includes('@')) {
      const profiles = await prisma.userProfile.findMany({ where: { email: { equals: who, mode: 'insensitive' } }, select: { userId: true, fullName: true } });
      if (profiles.length !== 1) {
        console.error(profiles.length === 0 ? `No profile with email ${who}.` : `Several profiles use ${who}; pass the userId instead:\n${profiles.map(p => `  ${p.userId}  ${p.fullName}`).join('\n')}`);
        process.exit(1);
      }
      userId = profiles[0].userId;
    }
    const existing = await prisma.userToken.findUnique({ where: { userId } });
    const next = Math.max(0, (existing?.tokens ?? 100) + amount);
    const saved = await prisma.userToken.upsert({
      where: { userId },
      update: { tokens: next },
      create: { userId, tokens: next },
    });
    console.log(`${userId}: ${existing?.tokens ?? '(new)'} -> ${saved.tokens} tokens`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(err => { console.error(err.message); process.exit(1); });
