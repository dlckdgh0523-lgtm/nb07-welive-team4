/*
  Warnings:

  - You are about to drop the column `contract` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contact]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contact` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_contract_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "contract",
ADD COLUMN     "contact" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_contact_key" ON "User"("contact");
