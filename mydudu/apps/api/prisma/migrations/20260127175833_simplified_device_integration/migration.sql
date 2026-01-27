/*
  Warnings:

  - You are about to drop the column `battery_level` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "sensor_type" ADD VALUE 'HEART_RATE';
ALTER TYPE "sensor_type" ADD VALUE 'NOISE_LEVEL';

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "battery_level";

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "created_at",
ADD COLUMN     "recorded_at" TIMESTAMP(6);
