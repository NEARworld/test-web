-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('COMMUNITY', 'FOODCARE', 'BAJAUL', 'RESTAURANT', 'CORP');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assigneeId" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileUrl" TEXT,
    "createdById" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "boardType" "BoardType" NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentModificationHistory" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedById" TEXT NOT NULL,
    "previousTitle" TEXT NOT NULL,
    "previousDescription" TEXT,
    "previousStatus" "TaskStatus" NOT NULL,
    "previousDueDate" TIMESTAMP(3),
    "previousAssigneeId" TEXT,
    "previousFileUrl" TEXT,
    "previousFileName" TEXT,
    "previousFileType" TEXT,

    CONSTRAINT "DocumentModificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_boardType_isDeleted_createdAt_idx" ON "Document"("boardType", "isDeleted", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DocumentModificationHistory_documentId_idx" ON "DocumentModificationHistory"("documentId");

-- CreateIndex
CREATE INDEX "DocumentModificationHistory_modifiedById_idx" ON "DocumentModificationHistory"("modifiedById");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentModificationHistory" ADD CONSTRAINT "DocumentModificationHistory_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentModificationHistory" ADD CONSTRAINT "DocumentModificationHistory_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
