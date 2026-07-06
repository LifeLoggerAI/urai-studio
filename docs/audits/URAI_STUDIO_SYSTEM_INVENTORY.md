# URAI Studio System Inventory

Snapshot: `main@4a1ce1bf39c821212f5b7565453761d85aad545c` on 2026-07-06.

## Deployable units

| Unit | Location | Purpose | Deployment | Status |
| --- | --- | --- | --- | --- |
| Studio web app | `apps/studio` | Public site, Studio shell, diagnostics, protected job/export APIs | Firebase Hosting/App Hosting | Implemented; current-head build/deploy unverified |
| Cloud Functions | `functions` | Owner bootstrap, job queue, publish/user management, Studio callables | Firebase Functions | Implemented; provider work remains fallback/scaffold |
| Shared packages | `packages/*` | Workspace libraries | Bundled into consumers | Present; full package-by-package runtime use not proven |
| Brain Map prototype | `brain-map-ui/src/BrainMap.tsx` | Hard-coded canvas system graph | None in canonical config | Disconnected prototype |

## Web interfaces

### Public/product

Declared and smoke-covered routes include `/`, `/about`, `/start`, `/work`, `/case-studies`, `/packages`, `/pricing`, `/services`, `/systems`, `/system`, `/generate`, `/motion`, `/cinema`, `/music`, `/visuals`, `/spatial`, `/privacy`, `/terms`, `/demo`, `/waitlist`, `/contact`, and `/status`.

### Studio/operator

- `/studio`
- `/studio/projects`
- `/studio/assets`
- `/studio/exports`
- `/studio/admin`
- `/studio/settings`
- `/studio/xr`
- `/studio/video-factory`
- `/dashboard`, `/assets`, `/integrations`, `/admin`, `/jobs`, `/settings`, `/usage`

The route inventory proves declared surfaces and source presence; only `scripts/smoke.sh` against a built server proves runtime behavior.

## APIs and probes

| Surface | Purpose | Auth/persistence | Status |
| --- | --- | --- | --- |
| `/healthz` | Liveness | Public | Implemented |
| `/readyz` | Readiness | Public | Implemented but readiness criteria incomplete |
| `/api/system/*` | Manifest, capabilities, health, contracts, OpenAPI, Spatial handoff | Public diagnostics | Implemented contract layer |
| `/api/contact`, `/api/waitlist` | Public intake | Firebase Admin when configured | Implemented; production persistence unverified |
| `/api/studio/jobs` | List/create tenant jobs | Firebase bearer token in production | Implemented; provider execution not connected |
| `/api/studio/exports` | List/create tenant exports | Firebase bearer token in production | Implemented; package generation/download absent |
| `/api/studio/video-factory` | Video factory route | Route contract present | Runtime/provider proof incomplete |

## Backend functions

`functions/src/index.ts` exports:

- `bootstrap-owner`
- `create-job`
- `job-runner`
- `on-job-write`
- `approve-publish`
- `user-management`
- `studio-system`

`studio-system.ts` provides callable rails for project creation, demo seeding, deterministic script/narration/SRT creation, asset job creation, admin asset-ready updates, export creation/processing/status, dashboard reads, and event logging.

## Persistence inventory

Observed collections across rules and code:

- Canonical/runtime candidates: `studios`, `memberships`, `clipRequests`, `jobs`, `jobRuns`, `assets`, `outputs`, `deadLetters`, `auditLogs`, `users`.
- Legacy/client-owned: `studioProjects`, `studioScenes`, `studioAssets`, `assetJobs`, `assetCollections`, `studioScrolls`, `narratorScripts`, `subtitles`, `voiceoverJobs`, `exportJobs`, `studioEvents`, `xrSessions`, `vrSessions`.
- Server-only contract store: `studioBriefs`, `studioJobs`, `studioExports`.
- Public intake/server-only: `waitlist`, `contactMessages`, `contactRequests`, `projectRequests`, `integrationRequests`.
- Configuration/public read: `catalogs`, `remoteConfigMirror`, `system/config`.

The overlapping collection families are an architectural gap. V50 must choose one canonical project/job/asset/export model and provide migration/compatibility rules.

## Storage inventory

- `/studios/{studioId}/uploads/**`
- `/studios/{studioId}/outputs/**`
- `/user-uploads/{uid}/studio/**`
- `/generated/{uid}/studio/**`
- `/public/studio-assets/**`
- Legacy runner writes under `/projects/{projectId}/renders/**` and `/projects/{projectId}/exports/**`, which is not represented in `storage.rules` for client access.

## Integration inventory

| Integration | Current evidence | Classification |
| --- | --- | --- |
| Asset Factory | URL registry + health bridge + contracts | Configured/disconnected diagnostics; no production job receipt |
| URAI Spatial | URL registry + static/OpenAPI handoff | Contract only; no publish/consume receipt |
| URAI Jobs | URL registry | URL/config only |
| URAI Content | URL registry | URL/config only |
| URAI Analytics | URL registry/module card | No ingestion/query proof |
| URAI Admin | URL registry/gated surfaces | No cross-service authorization proof |
| URAI Privacy | URL registry/privacy surface | No consent/deletion receipt proof |
| URAI Marketing | URL registry | External-link/fallback only |
| URAI Investors | URL registry | External-link/fallback only |
| B2B Portal | URL registry | No authenticated contract execution |
| Stripe | Environment names only | Not implemented/proven as a production flow |

## Quality and operations

- CI: `.github/workflows/studio-ci.yml`.
- Static regression runner: `apps/studio/tests/all.test.mjs` auto-imports `*.test.mjs`.
- Production-like HTTP smoke: `scripts/smoke.sh`.
- Guards: done-done, evidence schema, health summary, provider readiness.
- Release evidence: `docs/URAI_STUDIO_RELEASE_EVIDENCE.md` remains pending.
- Observability: Firestore event/audit documents and console logs exist; no proven centralized metrics, traces, alerting, SLOs, or incident automation.
