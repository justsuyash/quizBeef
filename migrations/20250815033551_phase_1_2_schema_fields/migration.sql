-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserQuestionHistory" ADD COLUMN     "timeToAnswer" INTEGER;
