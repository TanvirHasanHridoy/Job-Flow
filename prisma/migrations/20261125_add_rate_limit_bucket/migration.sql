-- Per-user fixed-window rate limit counters (see src/lib/rateLimit.ts)
CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key", "windowStart")
);

CREATE INDEX IF NOT EXISTS "RateLimitBucket_windowStart_idx" ON "RateLimitBucket"("windowStart");
