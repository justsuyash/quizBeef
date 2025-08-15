-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "county" TEXT,
ADD COLUMN     "eloRating" INTEGER NOT NULL DEFAULT 1200;
