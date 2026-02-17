-- DropForeignKey
ALTER TABLE "children" DROP CONSTRAINT "children_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "nutrition_status" DROP CONSTRAINT "nutrition_status_session_id_fkey";

-- DropForeignKey
ALTER TABLE "session_quiz_steps" DROP CONSTRAINT "session_quiz_steps_session_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_child_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_device_id_fkey";

-- AlterTable
ALTER TABLE "children" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "nutrition_status" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "session_quiz_steps" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "child_update_logs" (
    "id" BIGSERIAL NOT NULL,
    "child_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(20) NOT NULL,
    "field_name" VARCHAR(50) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "reason" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_update_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_update_logs" (
    "id" BIGSERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(20) NOT NULL,
    "field_name" VARCHAR(50) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "reason" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_update_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "child_update_logs_child_id_created_at_idx" ON "child_update_logs"("child_id", "created_at");

-- CreateIndex
CREATE INDEX "session_update_logs_session_id_created_at_idx" ON "session_update_logs"("session_id", "created_at");

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_quiz_steps" ADD CONSTRAINT "session_quiz_steps_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_status" ADD CONSTRAINT "nutrition_status_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_update_logs" ADD CONSTRAINT "child_update_logs_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_update_logs" ADD CONSTRAINT "child_update_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_update_logs" ADD CONSTRAINT "session_update_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_update_logs" ADD CONSTRAINT "session_update_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
