/*
  Warnings:

  - You are about to drop the column `clerUserId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clerkUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_clerUserId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "clerUserId",
ADD COLUMN     "clerkUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");
