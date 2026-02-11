# Pemeriksaan Session Flow Implementation Plan (Production-Safe v2)

## Objective
Enable operator workflow so the Pemeriksaan page shows children who completed measurement and are pending examination, ordered oldest-first, with `Batal Sesi` support. Do not store quiz process details.

## Core Domain Design
Do not mix clinical diagnosis and operational outcome in one string.

### Session state fields (same table as measurement)
- `examOutcome ExamOutcome @default(PENDING)`
- `diagnosisCode DiagnosisCode?`
- `diagnosisText String?` (used only when `diagnosisCode = OTHER`)
- `measurementCompleted Boolean @default(false)`
- `measurementCompletedAt DateTime?`
- `lockedByOperatorId Int?`
- `lockedAt DateTime?`
- `lockToken String?` (UUID, rotated on claim/takeover)
- `version Int @default(1)` (optimistic concurrency)
- `updatedAt DateTime @updatedAt`

### Enums
- `ExamOutcome`: `PENDING | DIAGNOSED | CANCELED`
- `DiagnosisCode`: controlled values (e.g. `PNEUMONIA | DENGUE | DIARRHEA_SEVERE | HEALTHY | OTHER`)

Notes:
- Use `examOutcome` as workflow source of truth.
- `diagnosisCode` is only set when `examOutcome = DIAGNOSED`.
- Replaces fragile literal `"TIDAK PERIKSA"` with `examOutcome = CANCELED`.
- Server clock is source of truth for lock and TTL checks.  
- Enum growth policy: new diagnosis values are added only via migration; use `OTHER + diagnosisText` as temporary fallback.

## Business Rules
- Queue shows sessions where:
- `measurementCompleted = true`
- `examOutcome = PENDING`
- Order: `recordedAt ASC`, fallback `id ASC`.
- No `status` filter for queue eligibility (single source: `measurementCompleted + examOutcome`).
- `Batal Sesi` sets:
- `examOutcome = CANCELED`
- `diagnosisCode = NULL`
- `lockedByOperatorId = NULL`, `lockedAt = NULL`
- Diagnose action sets:
- `examOutcome = DIAGNOSED`
- `diagnosisCode = <enum value>`
- `lockedByOperatorId = NULL`, `lockedAt = NULL`

## Data Model Changes (Prisma)
Target model: `Session` in `apps/api/prisma/schema.prisma`.

Add:
- `examOutcome ExamOutcome @default(PENDING) @map("exam_outcome")`
- `diagnosisCode DiagnosisCode? @map("diagnosis_code")`
- `measurementCompleted Boolean @default(false) @map("measurement_completed")`
- `lockedByOperatorId Int? @map("locked_by_operator_id")`
- `lockedAt DateTime? @map("locked_at") @db.Timestamp(6)`
- `lockToken String? @map("lock_token") @db.VarChar(64)`
- `version Int @default(1)`
- `updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamp(6)`
- `diagnosisText String? @map("diagnosis_text") @db.VarChar(255)`
- `measurementCompletedAt DateTime? @map("measurement_completed_at") @db.Timestamp(6)`

Indexes:
- `@@index([examOutcome, measurementCompleted, recordedAt], map: "idx_sessions_queue")`
- `@@index([lockedByOperatorId], map: "idx_sessions_lock_owner")`
- `@@index([measurementCompletedAt], map: "idx_sessions_measurement_completed_at")`

Relations:
- `lockedByOperator User? @relation("session_lock_owner", fields: [lockedByOperatorId], references: [id], onDelete: SetNull)`

## Migration Plan
1. Create enums and new columns.
2. Backfill existing sessions:
- `measurementCompleted = true` if any metric present.
- `examOutcome = PENDING` for rows without final clinical action.
- Keep `diagnosisCode = NULL` initially (unless trusted mapping exists).
3. Add indexes.
4. Regenerate Prisma client.

## API / Service Plan

### 1) Queue API (Pemeriksaan list)
- Endpoint: `GET /operator/pemeriksaan/queue`
- Filter:
- `measurementCompleted = true`
- `examOutcome = PENDING`
- Sort oldest-first.
- Response payload:
- `sessionId`, `recordedAt`, `child`, vitals, `lock` metadata, `isStale`, `lockExpired`, `claimable`.

### 2) Lock/claim API (avoid dual handling)
- Endpoint: `POST /operator/pemeriksaan/:sessionId/claim`
- Lock TTL: 5 minutes.
- Expiry rule (server time): lock is expired when `lockedAt < now() - TTL`.
- Claim algorithm:
- If not pending (`examOutcome != PENDING`): return `409`.
- If lock is empty: claim succeeds.
- If lock exists and expired: takeover succeeds.
- If lock exists, not expired, and owner is caller: idempotent success and refresh `lockedAt`.
- If lock exists, not expired, and owner is another operator: return `423`.
- On successful claim/takeover/idempotent refresh:
- set `lockedByOperatorId = callerId`
- set `lockedAt = now()`
- rotate `lockToken = uuid()`
- increment `version = version + 1`
- Return snapshot + `ttlSecondsRemaining` computed by server.

### 3) Renew lock API
- Endpoint: `POST /operator/pemeriksaan/:sessionId/renew-lock`
- Requires current lock owner + matching `lockToken`.
- If lock expired: return `423` (must re-claim).
- On success: update `lockedAt = now()`, return new TTL remaining.

### 4) Save diagnosis API
- Endpoint: `POST /operator/pemeriksaan/:sessionId/diagnose`
- Input: `diagnosisCode`, `diagnosisText?`, `version`, `lockToken`.
- Atomic update condition:
- `examOutcome = PENDING`
- lock owner = caller
- `lockToken` matches
- `version` matches current row
- Update:
- `examOutcome = DIAGNOSED`
- `diagnosisCode = input`
- `diagnosisText = input only if diagnosisCode = OTHER else NULL`
- `version = version + 1`
- clear lock

### 5) Cancel API (`Batal Sesi`)
- Endpoint: `POST /operator/pemeriksaan/:sessionId/cancel`
- Input: `version`, `lockToken`.
- Atomic update condition:
- `examOutcome = PENDING`
- lock owner = caller
- `lockToken` matches
- `version` matches
- Update:
- `examOutcome = CANCELED`
- `diagnosisCode = NULL`
- `diagnosisText = NULL`
- `version = version + 1`
- clear lock
- Idempotency:
- if already `CANCELED`, return success with current snapshot.

### 6) MQTT/device pipeline update
- When valid measurement ingestion is complete, set `measurementCompleted = true`.
- Also set `measurementCompletedAt = now()`.
- Completion criteria (server-side, explicit):
- minimal required metrics for queue eligibility: `weight`, `height`, `temperature`.
- if minimal set not met, keep `measurementCompleted = false`.
- Do not rely on ad-hoc non-null checks in queue queries.

### 7) Audit logging
- Log payload (minimum):
- `sessionId`
- `operatorId`
- `action` (`CLAIM | RENEW | DIAGNOSE | CANCEL`)
- `oldState` -> `newState` (`examOutcome`, lock owner, diagnosis code, token presence)
- `versionBefore`, `versionAfter`
- `timestamp`
- optional: `ip`, `userAgent`

## Concurrency and Integrity
- Use optimistic concurrency (`version`) in diagnose/cancel writes.
- Use ownership lock (`lockedByOperatorId`, `lockedAt`) for active editing.
- Use `lockToken` to prevent replay/stolen-lock writes.
- Conflict responses:
- `409` if version mismatch or session no longer pending.
- `423` if locked by another active operator.

## Stale Session Policy
Define automatic stale handling for pending sessions:
- `PENDING > 6 hours`: mark as stale in UI (badge only).
- `PENDING > 24 hours`: require supervisor review queue.
- No automatic state mutation unless explicitly approved.
- API mechanics:
- Add `isStale` in queue response (`recordedAt <= now() - 6h`).
- Add endpoint `GET /operator/pemeriksaan/stale?olderThanHours=24`.
- Access policy: stale endpoint visible to supervisor-capable roles only.

## Frontend Plan (Web Operator)

### 1) Queue
- Display pending queue from API, oldest-first.
- Show lock state:
- locked by others and not expired -> disabled
- locked but expired -> show `claimable` and allow claim
- stale badge based on `isStale`.

### 2) Session start
- On open session, call `claim` API.
- Start lock renewal timer (e.g., every 2 minutes).

### 3) Diagnose
- Use enum-based option mapping from quiz result to `diagnosisCode`.
- Submit with current `version`.

### 4) Cancel
- `Batal Sesi` confirmation modal.
- Call cancel endpoint with `version`.
- Remove session from queue immediately after success.

### 5) Conflict handling
- On `409/423`, show blocking message and refresh queue/session snapshot.

## Reporting / Analytics Plan
- Use `examOutcome` for operational KPIs (pending, canceled, diagnosed).
- Use `diagnosisCode` for clinical analytics and disease prevalence.
- Avoid NULL-semantics in dashboards.

## Testing Plan
1. Unit tests
- queue filter/sort correctness
- claim/renew lock rules + TTL behavior
- diagnose/cancel with version checks
2. Integration tests
- operator A claim, operator B blocked
- diagnose path finalizes state and clears lock
- cancel path finalizes state and clears lock
- idempotent cancel returns stable result
3. Race tests
- simultaneous diagnose vs cancel
- stale lock takeover after TTL
4. UI tests
- queue ordering, lock indicator, conflict flows

## Rollout Steps
1. Merge schema + migration + backfill.
2. Deploy API with compatibility read fallback (temporary).
3. Deploy web operator lock-aware flow.
4. Run staging smoke with 2 operators + device ingest.
5. Observe queue consistency/conflict metrics for 48 hours.

## Decisions Required Before Coding
1. Final `DiagnosisCode` enum list (initial set and naming standard).
2. Lock TTL exact value (default in plan: 5 minutes).
3. Minimal metric completion rule finalization (default in plan: weight+height+temperature).
4. Stale policy thresholds (`6h/24h`) confirmation.
