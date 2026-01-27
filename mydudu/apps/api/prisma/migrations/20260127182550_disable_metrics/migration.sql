/*
  Warnings:

  - You are about to drop the column `arm_circ` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `head_circ` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `oxy` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "arm_circ",
DROP COLUMN "head_circ",
DROP COLUMN "oxy";
