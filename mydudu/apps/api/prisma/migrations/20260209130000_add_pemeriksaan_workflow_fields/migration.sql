-- Add controlled workflow enums
CREATE TYPE "exam_outcome" AS ENUM ('PENDING', 'DIAGNOSED', 'CANCELED');
CREATE TYPE "diagnosis_code" AS ENUM ('PNEUMONIA', 'DENGUE', 'DIARRHEA_SEVERE', 'HEALTHY', 'OTHER');

-- Extend sessions with non-destructive workflow fields
ALTER TABLE "sessions"
ADD COLUMN "exam_outcome" "exam_outcome" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "diagnosis_code" "diagnosis_code",
ADD COLUMN "diagnosis_text" VARCHAR(255),
ADD COLUMN "measurement_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "measurement_completed_at" TIMESTAMP(6),
ADD COLUMN "locked_by_operator_id" INTEGER,
ADD COLUMN "locked_at" TIMESTAMP(6),
ADD COLUMN "lock_token" VARCHAR(64),
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill completion flag by mandatory metric presence
UPDATE "sessions"
SET "measurement_completed" = true,
    "measurement_completed_at" = COALESCE("measurement_completed_at", "recorded_at")
WHERE "weight" IS NOT NULL
  AND "height" IS NOT NULL
  AND "temperature" IS NOT NULL;

-- Foreign key for lock owner
ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_locked_by_operator_id_fkey"
FOREIGN KEY ("locked_by_operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "idx_sessions_queue" ON "sessions"("exam_outcome", "measurement_completed", "recorded_at");
CREATE INDEX "idx_sessions_lock_owner" ON "sessions"("locked_by_operator_id");
CREATE INDEX "idx_sessions_measurement_completed_at" ON "sessions"("measurement_completed_at");
