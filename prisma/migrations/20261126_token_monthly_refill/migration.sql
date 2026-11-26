-- Free plan: 100 tokens per calendar month (see src/lib/tokens.ts)
ALTER TABLE "UserToken" ADD COLUMN IF NOT EXISTS "lastRefillAt" TIMESTAMP(3);
ALTER TABLE "UserToken" ALTER COLUMN "tokens" SET DEFAULT 100;
