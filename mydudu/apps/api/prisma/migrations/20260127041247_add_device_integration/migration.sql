-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "firmware_version" VARCHAR(20),
ADD COLUMN     "hardware_version" VARCHAR(20);

-- CreateTable
CREATE TABLE "device_credentials" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "mqtt_username" VARCHAR(64) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_rotated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "device_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_credentials_device_id_key" ON "device_credentials"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_credentials_mqtt_username_key" ON "device_credentials"("mqtt_username");

-- AddForeignKey
ALTER TABLE "device_credentials" ADD CONSTRAINT "device_credentials_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
