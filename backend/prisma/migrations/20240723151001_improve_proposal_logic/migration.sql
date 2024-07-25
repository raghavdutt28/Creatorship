/*
  Warnings:

  - You are about to drop the `receivedProposal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sentProposal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "receivedProposal" DROP CONSTRAINT "receivedProposal_userId_fkey";

-- DropForeignKey
ALTER TABLE "sentProposal" DROP CONSTRAINT "sentProposal_userId_fkey";

-- DropTable
DROP TABLE "receivedProposal";

-- DropTable
DROP TABLE "sentProposal";

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "proposalMessage" TEXT NOT NULL,
    "equityPercentage" DOUBLE PRECISION NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proposal_senderId_idx" ON "Proposal"("senderId");

-- CreateIndex
CREATE INDEX "Proposal_receiverId_idx" ON "Proposal"("receiverId");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
