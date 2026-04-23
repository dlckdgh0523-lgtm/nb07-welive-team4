/*
  Warnings:

  - You are about to drop the column `adminId` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentDong` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentHo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `residentApartmentId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apartmentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[residentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ResidenceStatus" AS ENUM ('RESIDENCE', 'NO_RESIDENCE');

-- CreateEnum
CREATE TYPE "IsHouseholder" AS ENUM ('HOUSEHOLDER', 'MEMBER');

-- DropForeignKey
ALTER TABLE "Apartment" DROP CONSTRAINT "Apartment_adminId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_residentApartmentId_fkey";

-- DropIndex
DROP INDEX "Apartment_adminId_key";

-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "adminId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "apartmentDong",
DROP COLUMN "apartmentHo",
DROP COLUMN "apartmentName",
DROP COLUMN "residentApartmentId",
ADD COLUMN     "apartmentId" TEXT,
ADD COLUMN     "residentId" TEXT;

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "residenceStatus" "ResidenceStatus" NOT NULL DEFAULT 'RESIDENCE',
    "isHouseholder" "IsHouseholder" NOT NULL DEFAULT 'HOUSEHOLDER',
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "apartmentId" TEXT NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resident_contact_key" ON "Resident"("contact");

-- CreateIndex
CREATE UNIQUE INDEX "User_apartmentId_key" ON "User"("apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_residentId_key" ON "User"("residentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
