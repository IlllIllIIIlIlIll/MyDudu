/*
  Warnings:

  - You are about to drop the column `firmware_version` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `hardware_version` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `last_sync` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `boot_session_id` on the `measurements` table. All the data in the column will be lost.
  - You are about to drop the column `corrected_time` on the `measurements` table. All the data in the column will be lost.
  - You are about to drop the column `is_estimated` on the `measurements` table. All the data in the column will be lost.
  - You are about to drop the column `uptime_ms` on the `measurements` table. All the data in the column will be lost.
  - You are about to drop the column `boot_session_id` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the `device_credentials` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `device_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "device_credentials" DROP CONSTRAINT "device_credentials_device_id_fkey";

-- DropForeignKey
ALTER TABLE "device_logs" DROP CONSTRAINT "device_logs_device_id_fkey";

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "firmware_version",
DROP COLUMN "hardware_version",
DROP COLUMN "last_sync",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "measurements" DROP COLUMN "boot_session_id",
DROP COLUMN "corrected_time",
DROP COLUMN "is_estimated",
DROP COLUMN "uptime_ms";

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "boot_session_id",
DROP COLUMN "end_time",
DROP COLUMN "start_time",
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "device_credentials";

-- DropTable
DROP TABLE "device_logs";
