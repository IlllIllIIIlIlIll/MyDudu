/*
  Warnings:

  - A unique constraint covering the columns `[full_name,phone_number]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "idx_unique_fullname_phone" ON "users"("full_name", "phone_number");
