# Device Registration & HiveMQ Integration Guide (v3.0 - Production Ready)

This document outlines the **Best Practices** for integrating IoT devices with the MyDudu platform. It addresses advanced security threats (replay attacks, lateral movement) and operational realities (audit trails, field support).

## 1. Database Schema Design (Prisma)

**Critique Addressed**: Added temporal reasoning (`revokedAt`) for forensics and restored business context (`posyanduId`).

### Updated Prisma Model

```prisma
// Core Identity - The "Business" Entity
model Device {
  id           Int          @id @default(autoincrement())
  deviceUuid   String       @unique @map("device_uuid") @db.VarChar(64) // Permanent Hardware ID
  
  // Ownership & Context
  posyanduId   Int?         @map("posyandu_id")
  name         String       @db.VarChar(50)
  
  // Metadata
  firmwareVer  String?      @map("firmware_version") @db.VarChar(20)
  hardwareVer  String?      @map("hardware_version") @db.VarChar(20)
  
  // Real-time Status (Cached in Redis/Broker)
  status       DeviceStatus @default(OFFLINE) 
  
  // Relations
  credential   DeviceCredential? // One active credential set
  logs         DeviceLog[]
  sessions     Session[]
  incidents    Incident[]
  
  posyandu     Posyandu? @relation(fields: [posyanduId], references: [id])

  @@map("devices")
}

// Security - Isolated Credentials
model DeviceCredential {
  id           Int      @id @default(autoincrement())
  deviceId     Int      @unique @map("device_id")
  
  // Auth Identity (Opaque to business logic)
  mqttUsername String   @unique @map("mqtt_username") @db.VarChar(64) 
  
  // Secret (Hashed)
  passwordHash String   @map("password_hash") @db.Text 
  
  // Audit & Lifecycle
  lastRotated  DateTime @default(now()) @map("last_rotated")
  revokedAt    DateTime? @map("revoked_at") // NULL = Active. Date = Revoked when/why.

  device       Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@map("device_credentials")
}
```

---

## 2. Secure Provisioning (Nonce-Based)

**Critique Addressed**: Mitigated JWT replay attacks and token theft.

### The "Single-Use" Flow
1.  **Admin Action**: Clicks "Add Device".
2.  **Backend**:
    *   Generates `nonce` (random 16-byte string).
    *   Saves `nonce` to Redis `provision:nonce:{uuid}` with TTL 5m.
    *   Issues **Provisioning JWT**:
        ```json
        {
          "sub": "provisioning",
          "deviceUuid": "DUDU-v1-...",
          "nonce": "a7f3b9...",
          "exp": 1706254500 // 5 mins
        }
        ```
3.  **Transfer**: Admin shows QR Code.
4.  **Device Exchange**:
    *   Device connects to setup app -> receiving JWT.
    *   Device calls API: `POST /api/devices/provision` with JWT.
5.  **Verification (Critical)**:
    *   API extracts `nonce`.
    *   **Check**: Is `nonce` in Redis?
    *   **Atomic Delete**: `DEL provision:nonce:{uuid}`.
    *   If deleted count == 1 -> **Success**. Proceed to issue creds.
    *   If deleted count == 0 -> **Replay Detected**. Block IP.

---

## 3. High-Performance Authentication

**Critique Addressed**: Performance without security compromises.

### The "Decision Cache" Strategy
*   **Storage**: Always use **Argon2id** for `passwordHash`. Never downgrade storage security.
*   **Cache**: Cache the *Validation Result*, not the secret.

**Flow**:
1.  **Event**: HiveMQ `CLIENT_CONNECT`.
2.  **API**:
    *   **Hit Redis**: `GET auth:decision:{clientId}`.
    *   **If Valid**: Return `200 OK`. (0 DB hits).
    *   **If Miss**:
        *   Fetch `passwordHash` from DB.
        *   Verify Argon2id (Costly, ~50-100ms).
        *   If Valid: Set Redis `auth:decision:{clientId} = "1"` (TTL: 1h).
        *   Return `200 OK`.

*Note: If `revokedAt` is set, immediately invalidate the Redis key.*

---

## 4. Operational Gaps & Edge Cases

**Critique Addressed**: Trust anchors and compromise recovery.

### The "Trust Anchor" Problem
*   **Risk**: A rogue device can pretent to be "UUID-123".
*   **Solution (Hardware)**:
    *   Use a secure element (ATECC608A) or pre-flashed **Factory Key**.
    *   Provisioning payload must include a signature: `Sign(nonce, FactoryKey)`.
    *   Backend verifies signature before issuing MQTT creds.

### Compromise Response
If a device is stolen or compromised:
1.  **Revoke**: Admin sets `credential.revokedAt = NOW()`.
2.  **Disconnect**: Backend sends API call to HiveMQ -> `Disconnect Client {uuid}`.
3.  **Recovery**:
    *   Device tries to reconnect -> Fails.
    *   Device logic: "If Auth Fail > 10 times -> Enter PROVISIONING MODE".
    *   Admin must generate NEW Provisioning Token (QR) to re-onboard.

### Offline Provisioning
*   **Challenge**: No internet in the field.
*   **Approach**:
    *   Device acts as AP.
    *   Phone App acts as Gateway.
    *   Phone App caches "Pre-signed Credentials" downloaded earlier.
    *   Phone pushes creds to Device via HTTP (local).
    *   *Trade-off*: Higher risk of credential theft from Phone App.

---

## 5. Explicit Access Control (ACLs)

**Standard**: Least Privilege.

| Actor | Access | Topic Pattern | Rationale |
| :--- | :--- | :--- | :--- |
| **Device** | **PUB** | `dudu/v1/dev/{self_id}/telemetry` | Can only speak for itself. |
| **Device** | **PUB** | `dudu/v1/dev/{self_id}/events` | Can send alarms. |
| **Device** | **SUB** | `dudu/v1/dev/{self_id}/cmd` | Can only listen to its own commands. |
| **Backend** | **SUB** | `dudu/v1/dev/+/telemetry` | Listens to ALL devices. |
| **Backend** | **PUB** | `dudu/v1/dev/{target_id}/cmd` | Controls specific devices. |

*   **Enforcement**: HiveMQ Enterprise Security Extension (ESE) or Dynamic Security Plugin using regex matching on ClientID.
    *   Rule: `Client {client_id} ALLOW PUB dudu/v1/dev/{client_id}/#`
