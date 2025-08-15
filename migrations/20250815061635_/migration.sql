-- CreateTable
CREATE TABLE "EloHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "elo" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "note" TEXT,

    CONSTRAINT "EloHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EloHistory_userId_changedAt_idx" ON "EloHistory"("userId", "changedAt");

-- AddForeignKey
ALTER TABLE "EloHistory" ADD CONSTRAINT "EloHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
