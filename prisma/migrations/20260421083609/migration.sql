/*
  Warnings:

  - A unique constraint covering the columns `[id,apartmentId]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Resident_id_apartmentId_key" ON "Resident"("id", "apartmentId");
