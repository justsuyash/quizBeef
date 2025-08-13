-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('FREE', 'PREMIUM', 'KIDS', 'KIDS_PREMIUM', 'FAMILY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'FREE';
