/*
  Warnings:

  - You are about to drop the column `phone_number` on the `parent_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `parent_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `posyandu_id` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[parent_id]` on the table `parent_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `parent_id` to the `parent_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "parent_profiles" DROP CONSTRAINT "parent_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_posyandu_id_fkey";

-- DropIndex
DROP INDEX "parent_profiles_user_id_key";

-- AlterTable
ALTER TABLE "parent_profiles" DROP COLUMN "phone_number",
DROP COLUMN "user_id",
ADD COLUMN     "parent_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "password_hash",
DROP COLUMN "posyandu_id",
ADD COLUMN     "phone_number" VARCHAR(20),
ADD COLUMN     "village_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_parent_id_key" ON "parent_profiles"("parent_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
