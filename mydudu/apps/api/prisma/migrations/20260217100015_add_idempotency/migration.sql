/*
  Warnings:

  - A unique constraint covering the columns `[device_id,recorded_at]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "uq_device_recorded_at" ON "sessions"("device_id", "recorded_at");
