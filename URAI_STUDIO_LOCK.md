# URAI-STUDIO — LOCK

Commit: 0203cc5cdb58585abf600a219dae4f9fd7a83e07
UTC: Wed Feb  4 01:58:19 AM UTC 2026
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

