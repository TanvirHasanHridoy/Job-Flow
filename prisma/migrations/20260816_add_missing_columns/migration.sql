-- Add missing columns to UserProfile that were added via db push but never migrated
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "projects" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "customSections" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "personas" TEXT NOT NULL DEFAULT '[]';

-- Add missing columns to JobApplication that were added via db push but never migrated
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "techStack" TEXT DEFAULT '';
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "mainRequirements" TEXT DEFAULT '';
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "recruiterName" TEXT DEFAULT '';
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "contactInfo" TEXT DEFAULT '';
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "jobType" TEXT DEFAULT '';
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "location" TEXT DEFAULT '';
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "remoteOrPhysical" TEXT DEFAULT '';
