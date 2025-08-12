/*
  Warnings:

  - A unique constraint covering the columns `[handle]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('ADULT', 'KID');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "handle" TEXT,
ADD COLUMN     "profileType" "ProfileType" NOT NULL DEFAULT 'ADULT';

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
