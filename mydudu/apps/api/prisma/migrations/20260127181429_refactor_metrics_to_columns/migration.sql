/*
  Warnings:

  - You are about to drop the `measurements` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "measurements" DROP CONSTRAINT "measurements_session_id_fkey";

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "arm_circ" DECIMAL(5,2),
ADD COLUMN     "head_circ" DECIMAL(5,2),
ADD COLUMN     "heart_rate" DECIMAL(5,2),
ADD COLUMN     "height" DECIMAL(5,2),
ADD COLUMN     "noise_level" DECIMAL(5,2),
ADD COLUMN     "oxy" DECIMAL(5,2),
ADD COLUMN     "temperature" DECIMAL(4,2),
ADD COLUMN     "weight" DECIMAL(5,2);

-- DropTable
DROP TABLE "measurements";

-- DropEnum
DROP TYPE "sensor_type";
