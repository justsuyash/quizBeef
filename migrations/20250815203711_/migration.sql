-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "streakFreezeCount" INTEGER NOT NULL DEFAULT 1;
