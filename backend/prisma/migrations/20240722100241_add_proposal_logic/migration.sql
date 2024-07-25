/*
  Warnings:

  - You are about to drop the column `creatorId` on the `MediaItem` table. All the data in the column will be lost.
  - You are about to drop the `Business` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Creator` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `MediaItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MediaItem" DROP CONSTRAINT "MediaItem_creatorId_fkey";

-- AlterTable
ALTER TABLE "MediaItem" DROP COLUMN "creatorId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Business";

-- DropTable
DROP TABLE "Creator";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "isBusiness" BOOLEAN NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentProposal" (
    "id" TEXT NOT NULL,
    "proposalMessage" TEXT NOT NULL,
    "equityPercentage" DOUBLE PRECISION NOT NULL,
    "isAccepted" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sentProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivedProposal" (
    "id" TEXT NOT NULL,
    "proposalMessage" TEXT NOT NULL,
    "equityPercentage" DOUBLE PRECISION NOT NULL,
    "isAccepted" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "receivedProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sentProposal_userId_idx" ON "sentProposal"("userId");

-- CreateIndex
CREATE INDEX "receivedProposal_userId_idx" ON "receivedProposal"("userId");

-- AddForeignKey
ALTER TABLE "sentProposal" ADD CONSTRAINT "sentProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivedProposal" ADD CONSTRAINT "receivedProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
