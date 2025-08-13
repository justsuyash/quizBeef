-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuizMode" ADD VALUE 'RAPID_FIRE';
ALTER TYPE "QuizMode" ADD VALUE 'FLASHCARD_FRENZY';
ALTER TYPE "QuizMode" ADD VALUE 'TEST_MODE';
ALTER TYPE "QuizMode" ADD VALUE 'TIME_ATTACK';
ALTER TYPE "QuizMode" ADD VALUE 'PRECISION';
ALTER TYPE "QuizMode" ADD VALUE 'STUDY_MODE';
ALTER TYPE "QuizMode" ADD VALUE 'TRENDING';
ALTER TYPE "QuizMode" ADD VALUE 'AI_CURATED';

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "averageConfidence" DOUBLE PRECISION,
ADD COLUMN     "bonusPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficultyDistribution" JSONB,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "perfectStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timeLimit" INTEGER;
