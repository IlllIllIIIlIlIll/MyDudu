/*
  Warnings:

  - You are about to drop the column `is_active` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the `parent_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "device_connectivity_status" AS ENUM ('AVAILABLE', 'WAITING', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "children" DROP CONSTRAINT "children_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "parent_profiles" DROP CONSTRAINT "parent_profiles_parent_id_fkey";

-- AlterTable
ALTER TABLE "children" ALTER COLUMN "blood_type" SET DATA TYPE VARCHAR(5);

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "is_active",
ADD COLUMN     "status" "device_connectivity_status" NOT NULL DEFAULT 'INACTIVE';

-- DropTable
DROP TABLE "parent_profiles";

-- DropEnum
DROP TYPE "device_status";

-- CreateTable
CREATE TABLE "parents" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER NOT NULL,
    "village_id" INTEGER,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parents_parent_id_key" ON "parents"("parent_id");

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
