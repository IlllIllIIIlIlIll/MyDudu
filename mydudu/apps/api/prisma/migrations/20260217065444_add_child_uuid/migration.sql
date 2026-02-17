/*
  Warnings:

  - A unique constraint covering the columns `[child_uuid]` on the table `children` will be added. If there are existing duplicate values, this will fail.
  - The required column `child_uuid` was added to the `children` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "who_gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "who_growth_indicator" AS ENUM ('WEIGHT_FOR_AGE', 'WEIGHT_FOR_HEIGHT', 'WEIGHT_FOR_LENGTH', 'LENGTH_HEIGHT_FOR_AGE', 'BMI_FOR_AGE');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('VERCEL_BANDWIDTH', 'VERCEL_INVOCATIONS', 'NEON_STORAGE', 'NEON_COMPUTE', 'NEON_CONNECTIONS', 'UPSTASH_COMMANDS', 'UPSTASH_DATA_SIZE', 'APP_REQUEST_COUNT', 'APP_ERROR_COUNT', 'APP_AVG_LATENCY', 'APP_COLD_STARTS', 'AUTH_MAU', 'AUTH_ATTEMPTS', 'DATA_FRESHNESS');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('VERCEL', 'RENDER', 'NEON', 'UPSTASH', 'FIREBASE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "MetricStatus" AS ENUM ('VALID', 'ESTIMATED', 'FAILED_FETCH', 'PARTIAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "exam_outcome" ADD VALUE 'REFER_IMMEDIATELY';
ALTER TYPE "exam_outcome" ADD VALUE 'EMERGENCY';
ALTER TYPE "exam_outcome" ADD VALUE 'EXCLUDED';

-- AlterTable
ALTER TABLE "children" ADD COLUMN     "child_uuid" VARCHAR(64) NOT NULL;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "snapshot_nodes" JSONB,
ADD COLUMN     "tree_version" VARCHAR(64),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "who_growth_standards" (
    "id" SERIAL NOT NULL,
    "indicator" "who_growth_indicator" NOT NULL,
    "gender" "who_gender" NOT NULL,
    "age_days" INTEGER,
    "length_height_cm" DECIMAL(8,2),
    "l" DECIMAL(12,8) NOT NULL,
    "m" DECIMAL(12,8) NOT NULL,
    "s" DECIMAL(12,8) NOT NULL,
    "sd4_neg" DECIMAL(12,8),
    "sd3_neg" DECIMAL(12,8),
    "sd2_neg" DECIMAL(12,8),
    "sd1_neg" DECIMAL(12,8),
    "sd0" DECIMAL(12,8) NOT NULL,
    "sd1" DECIMAL(12,8),
    "sd2" DECIMAL(12,8),
    "sd3" DECIMAL(12,8),
    "sd4" DECIMAL(12,8),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "who_growth_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" BIGSERIAL NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "MetricType" NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "status" "MetricStatus" NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "limit" DECIMAL(18,4),
    "unit" VARCHAR(20) NOT NULL,
    "window_start" TIMESTAMP(3),
    "window_end" TIMESTAMP(3),
    "collection_duration_ms" INTEGER,
    "payload_hash" TEXT,
    "meta" JSONB,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics_derived" (
    "id" BIGSERIAL NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metricType" "MetricType" NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "days_remaining" DECIMAL(10,2),
    "projected_cost" DECIMAL(10,2),
    "anomaly_score" DECIMAL(5,4),
    "prediction_confidence" DECIMAL(5,4),

    CONSTRAINT "system_metrics_derived_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_diseases" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_decision_trees" (
    "id" SERIAL NOT NULL,
    "disease_id" VARCHAR(50) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "clinical_spec" JSONB NOT NULL,
    "tree_nodes" JSONB NOT NULL,
    "commit_note" TEXT,
    "spec_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "reviewer_id" INTEGER,
    "approved_at" TIMESTAMP(6),

    CONSTRAINT "clinical_decision_trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_expansion_proposals" (
    "id" SERIAL NOT NULL,
    "disease_id" VARCHAR(50) NOT NULL,
    "base_version" VARCHAR(50) NOT NULL,
    "proposed_spec" JSONB NOT NULL,
    "proposed_nodes" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "generated_by" VARCHAR(100),
    "reviewed_by" INTEGER,
    "review_notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(6),

    CONSTRAINT "tree_expansion_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_who_lookup" ON "who_growth_standards"("indicator", "gender", "age_days", "length_height_cm");

-- CreateIndex
CREATE INDEX "idx_metrics_lookup" ON "system_metrics"("timestamp", "type", "provider");

-- CreateIndex
CREATE INDEX "idx_derived_lookup" ON "system_metrics_derived"("metricType", "provider", "computed_at");

-- CreateIndex
CREATE INDEX "idx_clinical_tree_active" ON "clinical_decision_trees"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_clinical_tree_version" ON "clinical_decision_trees"("disease_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "children_child_uuid_key" ON "children"("child_uuid");

-- AddForeignKey
ALTER TABLE "clinical_decision_trees" ADD CONSTRAINT "clinical_decision_trees_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "clinical_diseases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_decision_trees" ADD CONSTRAINT "clinical_decision_trees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_decision_trees" ADD CONSTRAINT "clinical_decision_trees_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_expansion_proposals" ADD CONSTRAINT "tree_expansion_proposals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
