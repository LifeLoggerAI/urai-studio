# URAI-STUDIO — LOCK

Commit: 8219a3c6a154a511af379b2192c74fda25530dc0
UTC: Wed Feb  4 01:59:56 AM UTC 2026
Status: SHIP ✅
Log: /tmp/urai_studio_lock_20260204_015503.log
Backup: ../urai-studio.bak.20260204_015503.tgz

## App
- APP_DIR: apps/studio

## Build
- pnpm install
- pnpm -r lint (best-effort)
- pnpm -r typecheck (best-effort)
- build attempted for app

## Deploy
- firebase deploy --only hosting
- firebase deploy --only functions (if present)


## Notes
- Cloud Functions API is disabled in project `urai-studio` (403 SERVICE_DISABLED).
- This repo ships Studio via Hosting (frameworksBackend). No classic Functions deployment is required for SHIP.
