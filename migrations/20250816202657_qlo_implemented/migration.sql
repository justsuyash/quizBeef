/*
  Warnings:

  - You are about to drop the column `eloRating` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `EloHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EloHistory" DROP CONSTRAINT "EloHistory_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "eloRating",
ADD COLUMN     "qlo" INTEGER NOT NULL DEFAULT 100;

-- DropTable
DROP TABLE "EloHistory";

-- CreateTable
CREATE TABLE "QloHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "qlo" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "note" TEXT,

    CONSTRAINT "QloHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QloHistory_userId_changedAt_idx" ON "QloHistory"("userId", "changedAt");

-- AddForeignKey
ALTER TABLE "QloHistory" ADD CONSTRAINT "QloHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
