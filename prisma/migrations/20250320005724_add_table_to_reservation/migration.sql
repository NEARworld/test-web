-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "tableId" TEXT;

-- CreateIndex
CREATE INDEX "Reservation_tableId_idx" ON "Reservation"("tableId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
