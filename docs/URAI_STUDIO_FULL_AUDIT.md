# URAI Studio Full Repo and System Audit

Date: 2026-06-16
Repository: `LifeLoggerAI/urai-studio`
Default branch: `main`
Canonical app root: `apps/studio`
Canonical functions root: `functions`
Status: repo-side audit and completion lock, not live-production proof

## Bottom line

URAI Studio is not an empty shell. It has a real Next.js Studio app, Firebase Hosting/App Hosting configuration, Firebase Cloud Functions, Firestore-backed Studio project/demo/export callables, typed V1 through V5 system contracts, smoke/audit scripts, and a repo-level done-done guard.

URAI Studio is also not honestly done-done yet. The current evidence still shows placeholder generation/export behavior, at least one explicit payload-validation TODO in the legacy `createJob` callable, historical duplicate app roots that must stay non-canonical, and no recorded proof in this audit that install, lint, typecheck, tests, build, deploy, and live smoke have passed from a clean production environment.

## Evidence inspected

This audit is grounded in these actual repository files:

- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `firebase.json`
- `apphosting.yaml`
- `functions/package.json`
- `functions/tsconfig.json`
- `functions/src/index.ts`
- `functions/src/bootstrap-owner.ts`
- `functions/src/create-job.ts`
- `functions/src/job-runner.ts`
- `functions/src/studio-system.ts`
- `apps/studio/package.json`
- `apps/studio/README.md`
- `apps/studio/app/page.tsx`
- `apps/studio/lib/urai-system-contract.ts`
- `scripts/done-done-guard.mjs`
- `URAI_STUDIO_AUDIT.md`
- `docs/URAI_STUDIO_DONE_DONE_LOCK.md`

## What is completed or materially present

### Repository shape

The repo is a pnpm workspace with `apps/*` and `packages/*`. The root package identifies the workspace as `urai-studio-monorepo`, uses pnpm `9.7.0`, and exposes build, dev, lint, typecheck, test, smoke, audit, release check, emulator, doctor, repair, and preview scripts.

### Canonical app

`apps/studio` is the canonical Next.js app. The root README and done-done lock both identify `apps/studio` as the production app root. The homepage is not just a blank template: it renders a polished Studio landing surface with cinematic hero, magical home experience, system map, Studio modules, export-format cards, creator pathways, privacy-aware positioning, and clear calls to action.

### Firebase hosting and app hosting

`firebase.json` points Hosting at `apps/studio` and Functions at `functions`. Function predeploy is configured to install and build the functions package. `apphosting.yaml` exists at the repo root and configures Node.js twenty runtime, CPU/memory/concurrency, min/max instances, production `NODE_ENV`, and public site URL.

### Firebase functions spine

`functions/src/index.ts` exports callable/backend modules for owner bootstrap, job creation, job runner, job write hooks, publish approval, user management, and Studio system functions.

`bootstrap-owner.ts` requires authentication, checks system config, optionally matches bootstrap email, writes/updates the owner user, disables future bootstrap, and records an audit log.

`studio-system.ts` contains real callable rails for:

- health ping
- authenticated project creation
- demo project seeding
- script generation scaffold
- scene narration scaffold
- SRT generation scaffold
- companion intro scaffold
- asset job creation
- admin asset-ready marking
- export job creation
- export processing
- export status reads
- authenticated dashboard reads
- Studio event logging

### Job runner spine

`job-runner.ts` has a scheduled queue processor with queued/running state handling, lease expiration, attempts, audit logs, job event logs, output persistence to Storage, success/failure state updates, and retry/failure behavior.

### System-of-systems contract

`apps/studio/lib/urai-system-contract.ts` defines typed shared concepts for URAI systems, V1 through V5 capabilities, Studio projects, briefs, jobs, assets, exports, passport permissions, consent requirements, and safety boundaries. It includes V1 Genesis Home, V2 Cognitive Mirror, V3 Pattern Reflection, V4 WebXR Handoff, and V5 Mirror of Becoming contracts.

### Done-done guard

`scripts/done-done-guard.mjs` is a real repository guard. It verifies required docs/contracts, required runtime contract terms, deprecated-root import avoidance, and user-facing placeholder/debug/test labels in canonical production roots.

## What is partial

### Generation

Generation is not production-real yet. Several callable functions produce deterministic text scaffolds or manifests, not provider-backed generated assets. The queue runner writes placeholder files for clip renders, thumbnails, captions, and package exports. This is useful scaffolding, but it must be labeled as scaffolding until real providers and artifact verification are wired.

### Export

Export job creation and export status are real rails, but `processExportJob` currently marks a manifest ready in Firestore rather than proving a downloadable, tenant-scoped package exists in Storage with signed/download authorization.

### Job validation

The older `createJob` callable has an explicit payload-validation TODO. That is a real blocker for done-done status. The safer direction is to replace loose payload spreading with a strict accepted-kind schema, required `projectId`, bounded priority, normalized payload, project ownership/tenant checks, and audit logging of the sanitized payload only.

### Auth and tenancy

Authentication exists in multiple callables. Owner/admin/editor role checks exist in the legacy job creation path, and user ownership checks exist in export status processing. The current audit still needs full proof that every dashboard, asset, export, generated download, and admin operation is tenant scoped and tested.

### App documentation

The root README is specific to URAI Studio. `apps/studio/README.md` still appears to be default Next.js starter copy and should be replaced with a Studio-specific app runbook.

### Historical roots

The done-done lock explicitly marks `uraistudio-app/**`, root `app/**`, root `studio/**`, backups, and audit copies as non-canonical. Those paths still appear in search results, so they must remain excluded from production packaging and imports unless a later migration promotes them.

## What is not proven in this audit

This audit did not prove:

- clean dependency install
- lint pass
- typecheck pass
- tests pass
- Next build pass
- functions build pass
- emulator pass
- Firebase deploy pass
- live production smoke pass
- live `www.uraistudio.com` route verification
- production Stripe checkout verification
- real generation provider execution
- real asset factory integration
- real Studio-to-Spatial export consumption
- real Passport/consent receipt flows
- live analytics ingestion
- real signed download/retention/deletion proof

Do not claim any of those as complete until the terminal or CI evidence is recorded.

## Standalone product status

Current standalone status: hardened Studio app and backend foundation.

The public Studio surface is materially built and polished enough to serve as a launch-facing creative/product layer once build and smoke proof pass. The private/backend product layer is partially real: it can model projects, seed demos, create jobs, process queue states, write events, and prepare export metadata. It still needs production-grade generation, export packaging, payload validation, tenant proof, billing proof, and clean deploy evidence.

## System-of-systems status

Current system-of-systems status: typed contract foundation, not fully wired live mesh.

The repo correctly names and types the adjacent systems: URAI app, URAI Studio, URAI Spatial, URAI Privacy, URAI Foundation, URAI Analytics, Asset Factory, URAI Passport, and URAI Council. It also defines capability contracts for V1 through V5. However, a typed contract is not the same as live integration. Studio must not override Spatial release status, claim WebXR/AR/VR/real-time/provider readiness, or claim memory-grounded production behavior until downstream repos prove those claims with tests and live smoke evidence.

## Done-done blocker list

1. Replace legacy loose `createJob` payload handling with strict validation and sanitized persistence.
2. Replace placeholder render/export outputs with provider-backed or explicitly feature-gated output adapters.
3. Add tenant and ownership tests for projects, jobs, assets, exports, dashboards, admin actions, and downloads.
4. Add real export artifact writing with signed/download authorization and expiry behavior.
5. Replace `apps/studio/README.md` starter copy with a Studio-specific runbook.
6. Confirm deprecated roots are not imported, built, routed, or deployed.
7. Record fresh install/lint/typecheck/test/build/functions-build logs.
8. Record Firebase deploy evidence.
9. Record live smoke evidence against the production URL.
10. Record cross-repo handoff evidence for Asset Factory, Spatial, Analytics, Privacy/Passport, and Jobs.

## Safe completion order

### Phase one: lock the canonical surface

- Keep `apps/studio` as the only production app root.
- Keep `functions` as the only production functions root.
- Keep `packages/*` as shared libraries only.
- Keep historical roots excluded.
- Run the done-done guard before any release claim.

### Phase two: harden backend inputs

- Strictly validate job creation payloads.
- Require project ownership or admin/owner authority.
- Do not spread raw request data into persisted jobs.
- Log sanitized audit payloads only.

### Phase three: turn scaffolds into feature-gated adapters

- Add provider adapter interfaces for generation.
- Add `disabled`, `demo`, `configured`, and `live` status states.
- Return clear safe errors when providers are not configured.
- Keep public copy honest: scaffolds are not live generation.

### Phase four: make exports real

- Write export manifests and packages to Storage.
- Store checksums, sizes, MIME types, and expiry.
- Enforce tenant ownership on download and status reads.
- Add smoke fixtures for manifest and package output.

### Phase five: prove everything

Run and record:

```bash
corepack prepare pnpm@9.7.0 --activate
pnpm install --no-frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
pnpm done-done:guard
pnpm release:check
HOST=http://127.0.0.1:3000 pnpm studio:smoke
```

After deploy:

```bash
HOST=https://www.uraistudio.com bash scripts/smoke.sh
```

## Final release language

Safe language today:

> URAI Studio is a hardened Studio shell and backend foundation with typed system contracts, Firebase functions, project/job/export scaffolding, and a polished public surface. It is not yet fully production done-done until validation, real generation/export adapters, tenant tests, build/deploy proof, and live smoke evidence are recorded.

Unsafe language today:

> Fully live AI generation platform.
> Fully deployed production Studio.
> Real XR/WebXR/AR/VR handoff proven.
> Real provider-backed asset factory proven.
> Real billing proven.
> Full V1 through V5 system live.

## Check-in result

Repo-side audit file created to prevent overclaiming and to give the next engineering pass a clear done-done path. The remaining work requires code changes plus terminal/CI/deploy execution evidence before the repo can be honestly frozen as production complete.
