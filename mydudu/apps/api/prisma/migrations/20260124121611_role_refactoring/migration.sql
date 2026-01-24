-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'POSYANDU', 'PUSKESMAS', 'PARENT');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "device_status" AS ENUM ('ONLINE', 'OFFLINE', 'ERROR');

-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('IN_PROGRESS', 'COMPLETE', 'CLINICALLY_SUFFICIENT', 'INSUFFICIENT');

-- CreateEnum
CREATE TYPE "sensor_type" AS ENUM ('WEIGHT', 'HEIGHT', 'TEMP', 'OXY', 'ARM_CIRC', 'HEAD_CIRC');

-- CreateEnum
CREATE TYPE "nutrition_category" AS ENUM ('NORMAL', 'STUNTED', 'WASTED', 'OBESE');

-- CreateEnum
CREATE TYPE "validation_status" AS ENUM ('OK', 'WARN', 'FAIL');

-- CreateEnum
CREATE TYPE "notif_type" AS ENUM ('RESULT', 'REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "notif_status" AS ENUM ('SENT', 'READ');

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villages" (
    "id" SERIAL NOT NULL,
    "district_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),

    CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posyandus" (
    "id" SERIAL NOT NULL,
    "village_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT,

    CONSTRAINT "posyandus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'PARENT',
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "posyandu_id" INTEGER,
    "district_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "phone_number" VARCHAR(20),
    "address" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" CHAR(1),
    "blood_type" VARCHAR(3),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "device_uuid" VARCHAR(64) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "posyandu_id" INTEGER,
    "status" "device_status" NOT NULL DEFAULT 'OFFLINE',
    "battery_level" SMALLINT,
    "last_sync" TIMESTAMP(6),

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_logs" (
    "id" BIGSERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "log_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "battery" SMALLINT,
    "temperature" DECIMAL(5,2),
    "clock_drift_ms" BIGINT,
    "status" "validation_status" NOT NULL DEFAULT 'OK',

    CONSTRAINT "device_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "priority" VARCHAR(10),
    "status" VARCHAR(15) DEFAULT 'OPEN',
    "assigned_to" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(6),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "session_uuid" VARCHAR(64) NOT NULL,
    "child_id" INTEGER NOT NULL,
    "device_id" INTEGER NOT NULL,
    "operator_id" INTEGER,
    "start_time" TIMESTAMP(6) NOT NULL,
    "end_time" TIMESTAMP(6),
    "status" "session_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "boot_session_id" VARCHAR(64),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" BIGSERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "sensor_type" "sensor_type" NOT NULL,
    "value" DECIMAL(8,3) NOT NULL,
    "unit" VARCHAR(10),
    "corrected_time" TIMESTAMP(6),
    "uptime_ms" BIGINT,
    "boot_session_id" VARCHAR(64),
    "is_estimated" BOOLEAN DEFAULT false,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_status" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "bb_u" DECIMAL(5,2),
    "tb_u" DECIMAL(5,2),
    "bb_tb" DECIMAL(5,2),
    "category" "nutrition_category",

    CONSTRAINT "nutrition_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_records" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "validator_id" INTEGER,
    "validated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "validation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "generated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "notif_type" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "notif_status" NOT NULL DEFAULT 'SENT',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_articles" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(50),
    "image_url" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" SERIAL NOT NULL,
    "posyandu_id" INTEGER,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "event_date" DATE NOT NULL,
    "start_time" TIME,
    "end_time" TIME,
    "created_by" INTEGER,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geotags" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "geotags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_key" ON "districts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "villages_code_key" ON "villages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_user_id_key" ON "parent_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_uuid_key" ON "devices"("device_uuid");

-- CreateIndex
CREATE INDEX "idx_device_logs_device_time" ON "device_logs"("device_id", "log_time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_uuid_key" ON "sessions"("session_uuid");

-- CreateIndex
CREATE INDEX "idx_sessions_child_id" ON "sessions"("child_id");

-- CreateIndex
CREATE INDEX "idx_sessions_status" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "idx_measurements_session_sensor" ON "measurements"("session_id", "sensor_type");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_time" ON "audit_logs"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posyandus" ADD CONSTRAINT "posyandus_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_logs" ADD CONSTRAINT "device_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_status" ADD CONSTRAINT "nutrition_status_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_records" ADD CONSTRAINT "validation_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_records" ADD CONSTRAINT "validation_records_validator_id_fkey" FOREIGN KEY ("validator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geotags" ADD CONSTRAINT "geotags_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
