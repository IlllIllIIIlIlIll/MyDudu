-- Step 1: Add new columns
ALTER TABLE "devices" ADD COLUMN "village_id" INTEGER;
ALTER TABLE "schedules" ADD COLUMN "posyandu_name" VARCHAR(100);
ALTER TABLE "schedules" ADD COLUMN "village_id" INTEGER;

-- Step 2: Backfill data from posyandus before dropping it
UPDATE "devices" d
SET "village_id" = p."village_id"
FROM "posyandus" p
WHERE d."posyandu_id" = p."id";

UPDATE "schedules" s
SET "village_id" = p."village_id",
    "posyandu_name" = p."name"
FROM "posyandus" p
WHERE s."posyandu_id" = p."id";

-- Provide default for any potentially remaining null posyandu_name
UPDATE "schedules" SET "posyandu_name" = 'Unknown Posyandu' WHERE "posyandu_name" IS NULL;

-- Step 3: Remove legacy fields and constraints
ALTER TABLE "devices" DROP CONSTRAINT "devices_posyandu_id_fkey";
ALTER TABLE "posyandus" DROP CONSTRAINT "posyandus_village_id_fkey";
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_posyandu_id_fkey";

ALTER TABLE "devices" DROP COLUMN "posyandu_id";
ALTER TABLE "schedules" DROP COLUMN "posyandu_id";
DROP TABLE "posyandus";

-- Step 4: Make required and add new foreign keys
ALTER TABLE "schedules" ALTER COLUMN "posyandu_name" SET NOT NULL;
ALTER TABLE "devices" ADD CONSTRAINT "devices_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
