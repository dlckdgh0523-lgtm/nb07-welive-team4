/*
  Warnings:

  - The values [POOL] on the enum `BoardType` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `Poll` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `apartmentId` to the `Board` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'CLOSED');

-- AlterEnum
BEGIN;
CREATE TYPE "BoardType_new" AS ENUM ('NOTICE', 'POLL', 'COMPLAINT');
ALTER TABLE "Board" ALTER COLUMN "type" TYPE "BoardType_new" USING ("type"::text::"BoardType_new");
ALTER TYPE "BoardType" RENAME TO "BoardType_old";
ALTER TYPE "BoardType_new" RENAME TO "BoardType";
DROP TYPE "public"."BoardType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "apartmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "status",
ADD COLUMN     "status" "PollStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ALTER COLUMN "name" SET NOT NULL;

-- DropEnum
DROP TYPE "PoolStatus";

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "device" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
