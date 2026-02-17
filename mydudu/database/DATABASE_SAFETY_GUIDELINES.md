# Database Safety Guidelines - MyDudu Pediatric Health System

> [!CAUTION]
> **CRITICAL: READ BEFORE ANY DATABASE OPERATION**
> This document contains mandatory safety protocols to prevent data loss. Violation of these guidelines can result in permanent data loss of patient records.

## Table of Contents
1. [Environment Separation](#environment-separation)
2. [Migration Safety Protocol](#migration-safety-protocol)
3. [Database Tables Reference](#database-tables-reference)
4. [CRUD Operation Guidelines](#crud-operation-guidelines)
5. [Backup and Recovery](#backup-and-recovery)

---

## Environment Separation

### MANDATORY: Separate Databases
**NEVER** use the same database for development and production!

#### ❌ WRONG - Single database for all environments
```env
DATABASE_URL="postgresql://...production-db..."
```

#### ✅ CORRECT - Separate databases
```env
# Production (.env.production)
DATABASE_URL="postgresql://...production-db..."

# Development (.env or .env.local)
DATABASE_URL="postgresql://...development-db..."

# Testing (.env.test)
DATABASE_URL="postgresql://...test-db..."
```

### Environment Configuration
| Environment | Database | Migrations | Seed Data | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Production** | Neon Production | `prisma migrate deploy` only | ❌ Never | Live patient data |
| **Development** | Neon Dev Branch or Local | `prisma migrate dev` | ✅ Safe | Local testing |
| **Testing** | Separate test DB | Reset before each test | ✅ Required | Automated tests |

---

## Migration Safety Protocol

### ⚠️ CRITICAL RULES
- **NEVER** run `prisma migrate dev` against production.
- **NEVER** confirm schema reset on production database.
- **ALWAYS** test migrations on development first.
- **ALWAYS** create backups before migrations.

### Safe Migration Workflow
1. **Create Development Branch:** Use Neon Console to create a branch from `main`.
2. **Develop Schema:** Make changes in `schema.prisma`.
3. **Generate Migration:** `npx prisma migrate dev --name <descriptive-name>`
4. **Verify Locally:** Test with local data.
5. **Backup Production:** `pg_dump` or Neon snapshot.
6. **Deploy:** `npx prisma migrate deploy`

### Adding Columns to Non-Empty Tables
**NEVER** use Prisma's default for required columns on existing data!

#### ❌ WRONG - Causes schema reset
```sql
ALTER TABLE "children" ADD COLUMN "child_uuid" VARCHAR(64) NOT NULL;
```

#### ✅ CORRECT - 3-Step Process
1. **Add as Nullable:**
   ```sql
   ALTER TABLE "children" ADD COLUMN "child_uuid" VARCHAR(64);
   ```
2. **Backfill Data:**
   ```sql
   UPDATE "children" SET "child_uuid" = gen_random_uuid() WHERE "child_uuid" IS NULL;
   ```
3. **Make Required:**
   ```sql
   ALTER TABLE "children" ALTER COLUMN "child_uuid" SET NOT NULL;
   CREATE UNIQUE INDEX "children_child_uuid_key" ON "children"("child_uuid");
   ```

---

## Database Tables Reference

### 📍 Location Hierarchy (READ-ONLY after initial seed)

#### `districts`
- **Purpose:** Administrative districts (Kecamatan).
- **CRUD Rules:**
  - ✅ **CREATE:** Initial setup only.
  - ✅ **READ:** Always safe.
  - ⚠️ **UPDATE:** Corrections only.
  - ❌ **DELETE:** Never (cascading relations).

#### `villages`
- **Purpose:** Villages (Kelurahan/Desa).
- **CRUD Rules:**
  - ✅ **CREATE:** Initial setup only.
  - ✅ **READ:** Always safe.
  - ⚠️ **UPDATE:** Corrections only.
  - ❌ **DELETE:** Never.

#### `posyandus`
- **Purpose:** Health posts.
- **CRUD Rules:**
  - ✅ **CREATE:** New posyandu opening.
  - ✅ **READ:** Always safe.
  - ✅ **UPDATE:** Address/name changes.
  - ⚠️ **DELETE:** Only if permanently closed (check devices first).

### 👥 User Management

#### `users`
- **Purpose:** All system users (Admin, Puskesmas, Posyandu, Parents).
- **CRUD Rules:**
  - ✅ **CREATE:** Registration.
  - ✅ **READ:** Safe.
  - ✅ **UPDATE:** Profile/Role.
  - ⚠️ **DELETE:** Soft delete only using `status = 'SUSPENDED'` or `deletedAt`.

#### `parents`
- **Purpose:** Extended parent profiles.
- **CRUD Rules:**
  - ❌ **DELETE:** Never directly (cascades from User).

### 👶 Patient Data (CRITICAL - NEVER DELETE)

#### `children`
- **Purpose:** Patient records.
- **Type:** **PROTECTED PATIENT DATA**
- **CRUD Rules:**
  - ✅ **CREATE:** New registration.
  - ✅ **READ:** Safe.
  - ✅ **UPDATE:** Corrections.
  - ❌ **DELETE:** **NEVER**.

### 📊 Medical Records (CRITICAL - NEVER DELETE)

#### `sessions`
- **Purpose:** Screening/examination sessions.
- **Type:** **PROTECTED MEDICAL DATA**
- **CRUD Rules:**
  - ✅ **CREATE:** New session.
  - ✅ **READ:** Safe.
  - ✅ **UPDATE:** Measurements/Diagnosis.
  - ❌ **DELETE:** **NEVER**.

#### `session_quiz_steps`
- **Purpose:** Clinical decision history.
- **Type:** **AUDIT TRAIL**
- **Rules:** Immutable.

### 📈 WHO Growth Standards (READ-ONLY)

#### `who_growth_standards`
- **Purpose:** Reference data.
- **CRUD Rules:**
  - ❌ **UPDATE/DELETE:** **NEVER**. Protected by DB Trigger.

---

## CRUD Operation Guidelines

### Safe Operations (Always Allowed)
```typescript
// Reading data
await prisma.child.findMany();

// Creating records
await prisma.session.create({ ... });

// Updating status
await prisma.user.update({
  where: { id },
  data: { status: 'ACTIVE' }
});
```

### Restricted Operations (Require Approval)
```typescript
// ⚠️ Updating medical records (corrections only)
await prisma.child.update({
  where: { id },
  data: { fullName: 'Corrected Name' } // Requires justification
});

// ⚠️ Soft delete (preferred over hard delete)
await prisma.user.update({
  where: { id },
  data: { 
    status: 'SUSPENDED',
    deletedAt: new Date()
  }
});
```

### Forbidden Operations (NEVER ALLOWED)
```typescript
// ❌ NEVER delete patient data
await prisma.child.delete({ where: { id } });

// ❌ NEVER delete medical records
await prisma.session.delete({ where: { id } });

// ❌ NEVER delete WHO reference data
await prisma.whoGrowthStandard.deleteMany();

// ❌ NEVER truncate tables
await prisma.$executeRaw`TRUNCATE TABLE children CASCADE`;
```

---

## Backup and Recovery

### Automated Backups
- **Neon Free:** ❌ None.
- **Neon Pro:** ✅ Point-in-time recovery (7-30 days).

### Manual Backup Strategy
1. **Weekly Full Backup:**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```
2. **Pre-Migration Backup:**
   ```bash
   pg_dump $DATABASE_URL > pre_migration_$(date +%Y%m%d_%H%M%S).sql
   ```
3. **Export Critical Tables:**
   ```bash
   npx prisma db execute --file export_children.sql > children_backup.csv
   ```

### Emergency Contacts
| Issue | Action | Contact |
| :--- | :--- | :--- |
| **Accidental Deletion** | STOP IMMEDIATELY | Database Admin |
| **Migration Failure** | Rollback | DevOps Team |
| **Data Corruption** | Restore from Backup | Database Admin |
| **Schema Reset Prompt** | **CANCEL IMMEDIATELY** | Do not proceed |
