-- AlterEnum: Safe rename using ALTER TYPE ... RENAME VALUE
-- This is safe for existing rows — no data loss, no cast required.
ALTER TYPE "session_status" RENAME VALUE 'COMPLETE' TO 'MEASURED';
ALTER TYPE "session_status" RENAME VALUE 'CLINICALLY_SUFFICIENT' TO 'CLINICAL_ACTIVE';
ALTER TYPE "session_status" RENAME VALUE 'INSUFFICIENT' TO 'CLINICALLY_DONE';
