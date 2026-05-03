# URAI Studio Launch Ready Report

Generated: 2026-05-03T23:02:40Z

## 1) Route coverage

### Public/site routes
- `/`
- `/systems`
- `/studio`
- `/motion`
- `/cinema`
- `/music`
- `/visuals`
- `/spatial`
- `/privacy`
- `/demo`
- `/waitlist`
- `/contact`
- `/status`
- `/dashboard`
- `/assets`
- `/assets/[id]`
- `/asset-factory`

### Ops/internal-facing routes
- `/admin`
- `/analytics`
- `/integrations`
- `/jobs`
- `/settings`
- `/usage`
- `/system`

### Health routes
- `/healthz`
- `/api/health`

## 2) API contract coverage

### System contracts
- `GET /api/system/health`
- `GET /api/system/manifest`
- `GET /api/system/capabilities`
- `GET /api/system/integration-contract`
- `GET /api/system/openapi`

### Integration probes
- `GET /api/integrations/asset-factory/health`
- `GET /api/integrations/asset-factory/manifest`

### Intake contracts
- `POST /api/waitlist`
- `POST /api/contact`

### Validation and behavior guarantees
- Shared server-side intake validation in `lib/studio/schema.ts`
- Shared persistence + fallback behavior in `lib/studio/intake.ts`
- Consistent JSON responses from all listed routes
- Input validation errors return HTTP 400 with error codes

## 3) Fallback matrix (local vs Firebase)

| Surface | Local/dev without Firebase Admin | Firebase Admin configured |
|---|---|---|
| `/api/waitlist` | validates input, returns `persisted:false`, demo-safe message | validates and writes to Firestore `waitlist`, returns `persisted:true` |
| `/api/contact` | validates input, returns `persisted:false`, demo-safe message | validates and writes to Firestore `contact`, returns `persisted:true` |
| `/status` | renders fallback diagnostics when health fetch is unavailable | renders live snapshots of `/api/system/health`, `/api/health`, `/healthz` |
| Asset Factory probe endpoints | returns disconnected/fallback diagnostics when URL/env missing or upstream unavailable | returns live probe payload when upstream reachable |
| Studio UI system cards | data-driven module + status rendering with fallback labels | same UI with live health/integration values where configured |

### Server credential behavior
- Firebase Admin init path:
  1. explicit service-account env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
  2. fallback to `applicationDefault()` when project id is available
  3. fallback mode when admin initialization is unavailable

## 4) Verification commands and current status

Executed verification suite:

```bash
pnpm --filter studio lint
pnpm --filter studio typecheck
pnpm --filter studio test
pnpm --filter studio build
pnpm --filter studio smoke
```

Current result: PASS (lint/typecheck/test/build/smoke all passing).

## 5) Exact deployment/runbook commands

### A) Firebase Hosting (current project target)

```bash
firebase use urai-studio
firebase target:apply hosting urai-studio urai-studio --project urai-studio
pnpm --filter studio build
firebase deploy --only hosting:urai-studio --project urai-studio
```

### B) Firebase App Hosting (if using App Hosting backend)

1. Ensure App Hosting backend is configured for this repo/app.
2. Ensure required env vars are set in App Hosting environment.
3. Build + deploy via Firebase App Hosting flow (console or CLI according to project setup):

```bash
pnpm --filter studio build
# then deploy through configured App Hosting backend for project urai-studio
```

## 6) Operational runbook (post-deploy)

1. Check health endpoints:
   - `/healthz`
   - `/api/health`
   - `/api/system/health`
2. Verify intake endpoints with valid/invalid payloads.
3. Verify `/status` snapshot renders all three health cards.
4. Verify required public routes return 200 and render expected sections.
5. If Firestore persistence expected, submit test waitlist/contact entries and confirm collection writes.

## 7) Remaining launch notes

- Local/demo mode intentionally supports non-persistent intake and disconnected integration diagnostics.
- Production mode should set Firebase Admin credentials (or ADC) and integration URLs for full persistence and probe fidelity.
- No secrets should be committed; use `.env.example` as template.
