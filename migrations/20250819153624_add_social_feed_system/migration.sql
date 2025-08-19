-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('QUIZ_COMPLETED', 'QUIZ_HIGH_SCORE', 'DOCUMENT_UPLOADED', 'ACHIEVEMENT_EARNED', 'BEEF_WON', 'BEEF_CHALLENGE_CREATED', 'FOLLOW_USER', 'DOCUMENT_LIKED', 'STREAK_MILESTONE');

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedActivity" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ActivityType" NOT NULL,
    "data" JSONB NOT NULL,
    "userId" INTEGER NOT NULL,
    "documentId" INTEGER,
    "quizAttemptId" INTEGER,

    CONSTRAINT "FeedActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFollow_followerId_idx" ON "UserFollow"("followerId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "FeedActivity_createdAt_idx" ON "FeedActivity"("createdAt");

-- CreateIndex
CREATE INDEX "FeedActivity_userId_createdAt_idx" ON "FeedActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedActivity_type_createdAt_idx" ON "FeedActivity"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedActivity" ADD CONSTRAINT "FeedActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedActivity" ADD CONSTRAINT "FeedActivity_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedActivity" ADD CONSTRAINT "FeedActivity_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
