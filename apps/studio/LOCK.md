# URAI Studio v1 LOCK (20260203_050814)

## What is locked
- Studio shell UI (nav/layout/pages)
- RBAC middleware gate (viewer/operator/founder)
- Jobs list wired to Firestore (server/Admin SDK)
- Replay + DLQ Replay flows (idempotent commands + audit)
- Firestore index spec committed at repo root: `firestore.indexes.json`

## Routes
- GET  /api/health
- GET  /api/jobs/list?q=&status=&limit=
- POST /api/jobs/replay        { jobId, reason? }
- POST /api/jobs/dlq-replay    { jobId, reason? }

## Firestore collections (server-owned)
- jobs/{jobId}
- jobCommands/{kind:jobId}  (idempotent)
- auditLogs/{autoId}        (append-only)

## RBAC
- Required custom claim: `role` = founder | operator | viewer
- Enforced paths:
  - /studio/settings        => founder
  - /studio/jobs            => operator
  - /api/jobs/replay        => operator
  - /api/jobs/dlq-replay    => operator
  - /studio/* (default)     => viewer

## Deploy notes
- Ensure Firebase project has composite index:
  - jobs: status ASC, updatedAt DESC
- See: apps/studio/docs/FIRESTORE_RULES_NOTES.md

## Change control
- Any changes to shell/layout/middleware/routes must bump this file timestamp + add a note in CHANGELOG.
