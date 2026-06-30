# URAI Studio route map proof

Recorded: 2026-06-30

## Source of route map

Primary route inventory is taken from `apps/studio/tests/routes-smoke.mjs`, which declares 33 expected routes for static route smoke coverage.

## Public routes

- `/`
- `/systems`
- `/system`
- `/studio`
- `/studio/projects`
- `/studio/assets`
- `/studio/exports`
- `/studio/settings`
- `/studio/xr`
- `/motion`
- `/cinema`
- `/music`
- `/visuals`
- `/spatial`
- `/privacy`
- `/terms`
- `/demo`
- `/waitlist`
- `/contact`
- `/status`
- `/dashboard`
- `/assets`
- `/integrations`
- `/jobs`
- `/settings`
- `/usage`

## Admin / operator routes

- `/admin` — public-visible gate page. When admin QA is disabled it shows admin-disabled copy instead of controls.
- `/studio/admin` — Studio QA panel route. When admin QA is disabled it shows gated copy instead of the callable action panel.

## API / health / system routes

- `/api/health`
- `/api/system/health`
- `/api/system/spatial-handoff`
- `/healthz`
- `/readyz`

Additional inspected API routes:

- `/api/contact`
- `/api/waitlist`
- `/api/system/urai-contract`
- `/api/studio/jobs`
- `/api/studio/exports`

## Route protection classification

- Public marketing/module routes: GATED/PUBLIC INFORMATIONAL.
- Admin QA pages: GATED by `NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED` / `STUDIO_ADMIN_QA_ENABLED`; not enabled by default in `apphosting.yaml`.
- Studio jobs API: requires Studio auth in production and returns 401 without a Firebase bearer token.
- Studio exports API: requires Studio auth in production and returns 401 without a Firebase bearer token.
- Runtime system collections are denied to direct client SDK access by Firestore rules and are expected to be written through trusted server/Admin routes.

## Route readiness notes

The route map is broad and well-covered by declared smoke expectations, but this pass did not execute the live server or browser route checks. Route existence should be treated as repository-level proof only until install/build/start/live-smoke logs are attached.