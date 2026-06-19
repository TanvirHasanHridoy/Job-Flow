/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `signatureUrl` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "photoUrl",
DROP COLUMN "signatureUrl",
ADD COLUMN     "photo" TEXT,
ADD COLUMN     "signature" TEXT;
