# URAI Studio Firestore Rules Notes (v1)

Studio reads:
- `jobs` (list + filter by `status`)
- `jobCommands` (write idempotent replay requests)
- `auditLogs` (append-only)

Recommended rules approach:
- Only allow Studio service (server/Admin SDK) to read/write these in production.
- If you later add client-side Firestore, enforce RBAC:
  - `role: founder|operator|viewer` custom claim

If you DO allow client reads in dev:
- `jobs`: allow read for viewer+
- `jobCommands`: allow create for operator+
- `auditLogs`: allow create for operator+, no read unless founder

Indexes required by current queries:
- jobs: `orderBy(updatedAt desc)` (single-field auto index)
- jobs: `where(status == X) + orderBy(updatedAt desc)` (composite index)
