-- CreateEnum
CREATE TYPE "BeefStatus" AS ENUM ('WAITING', 'STARTING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BeefChallenge" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "challengeCode" TEXT NOT NULL,
    "title" TEXT,
    "status" "BeefStatus" NOT NULL DEFAULT 'WAITING',
    "maxParticipants" INTEGER NOT NULL DEFAULT 2,
    "timeLimit" INTEGER NOT NULL DEFAULT 60,
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "difficultyDistribution" JSONB,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "documentId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "BeefChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeefParticipant" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "finalScore" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER,
    "userId" INTEGER NOT NULL,
    "challengeId" INTEGER NOT NULL,

    CONSTRAINT "BeefParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeefRound" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roundNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "timeLimit" INTEGER NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "BeefRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeefAnswer" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "participantId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "selectedAnswerId" INTEGER,

    CONSTRAINT "BeefAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BeefChallenge_challengeCode_key" ON "BeefChallenge"("challengeCode");

-- CreateIndex
CREATE INDEX "BeefChallenge_challengeCode_idx" ON "BeefChallenge"("challengeCode");

-- CreateIndex
CREATE INDEX "BeefChallenge_status_idx" ON "BeefChallenge"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BeefParticipant_userId_challengeId_key" ON "BeefParticipant"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "BeefRound_challengeId_roundNumber_key" ON "BeefRound"("challengeId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BeefAnswer_participantId_roundId_key" ON "BeefAnswer"("participantId", "roundId");

-- AddForeignKey
ALTER TABLE "BeefChallenge" ADD CONSTRAINT "BeefChallenge_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeefChallenge" ADD CONSTRAINT "BeefChallenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeefParticipant" ADD CONSTRAINT "BeefParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeefParticipant" ADD CONSTRAINT "BeefParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "BeefChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeefRound" ADD CONSTRAINT "BeefRound_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "BeefChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeefRound" ADD CONSTRAINT "BeefRound_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeefAnswer" ADD CONSTRAINT "BeefAnswer_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "BeefParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeefAnswer" ADD CONSTRAINT "BeefAnswer_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "BeefRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeefAnswer" ADD CONSTRAINT "BeefAnswer_selectedAnswerId_fkey" FOREIGN KEY ("selectedAnswerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
