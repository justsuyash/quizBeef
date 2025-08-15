/*
  Warnings:

  - You are about to drop the column `category` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `QuizAttempt` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `QuizAttempt` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `county` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `eloRating` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `timeToAnswer` on the `UserQuestionHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "QuizAttempt" DROP COLUMN "endTime",
DROP COLUMN "startTime";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "county",
DROP COLUMN "eloRating";

-- AlterTable
ALTER TABLE "UserQuestionHistory" DROP COLUMN "timeToAnswer";
