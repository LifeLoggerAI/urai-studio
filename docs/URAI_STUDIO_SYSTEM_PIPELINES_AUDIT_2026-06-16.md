# URAI Studio System Pipelines Audit

Date: 2026-06-16
Repository: `LifeLoggerAI/urai-studio`
Scope: Studio standalone system plus URAI system-of-systems pipelines
Status: repo-side audit and improvement record; not a live deploy claim

## Executive finding

URAI Studio is a real system foundation, not an empty app. It has a canonical Next app, Firebase Functions, Firestore and Storage rules, typed URAI V1 through V5 contracts, system health routes, smoke checks, audit scripts, and a growing Studio-to-Spatial handoff contract.

It is not fully done-done yet. Several pipelines are represented as contracts, diagnostics, fallback modules, or scaffolds rather than fully verified live service integrations. Live production status still requires terminal or CI evidence for install, lint, typecheck, tests, build, functions build, deploy, and production smoke.

## Evidence inspected

- `package.json`
- `pnpm-workspace.yaml`
- `apps/studio/package.json`
- `functions/package.json`
- `apps/studio/lib/studio/modules.ts`
- `apps/studio/lib/studio/systems.ts`
- `apps/studio/lib/studio/system-of-systems.ts`
- `apps/studio/lib/studio/integrations.ts`
- `apps/studio/lib/urai-system-contract.ts`
- `apps/studio/lib/studio-runtime-store.ts`
- `apps/studio/lib/studio-spatial-handoff.ts`
- `apps/studio/app/api/system/integration-contract/route.ts`
- `apps/studio/app/api/system/spatial-handoff/route.ts`
- `apps/studio/app/api/system/health/route.ts`
- `functions/src/index.ts`
- `functions/src/create-job.ts`
- `functions/src/job-runner.ts`
- `functions/src/studio-system.ts`
- `firestore.rules`
- `storage.rules`
- `scripts/done-done-guard.mjs`
- `scripts/studio-smoke-v1.js`
- `scripts/smoke.sh`
- `.github/workflows/studio-audit.yml`

## Repo and build pipeline

Status: materially present, not freshly executed in this audit.

The root repo is a pnpm workspace with `apps/*` and `packages/*`. The canonical app package is `apps/studio`. Functions are separate under `functions`.

Root scripts exist for build, dev, lint, typecheck, test, smoke, audit, release check, emulators, demo seeding, cleanup, repair, and preview. The Studio app package has Next build/start/dev, lint, typecheck, file-based tests, static smoke, and smoke commands. Functions have TypeScript build and typecheck scripts.

Main gap: this audit used GitHub file access only. It did not execute the commands, so no fresh pass/fail proof is claimed.

## CI and release pipeline

Status: present, needs current run evidence.

The GitHub Actions workflow runs on main pushes, pull requests, and manual dispatch. It installs pnpm, sets Node twenty, installs dependencies, runs the done-done guard, lint, typecheck, test, build, functions install, functions build, and Studio smoke.

The release spine exists. The missing piece is current workflow evidence for the latest commits and live smoke after deploy.

## Public app pipeline

Status: materially built.

The app contains public routes, system pages, Studio pages, legal/status pages, and a V1-style home surface. Route smoke coverage exists for the major pages and system APIs.

Risk: user-facing status labels must stay aligned with proven backend capabilities. The safer module registry says most integrations are fallback or disconnected, while some public system maps use broader status labels such as Live, Demo, Prototype, Internal, or Planned.

## Backend functions pipeline

Status: real rails with remaining hardening.

Functions export owner bootstrap, job creation, job runner, job write hooks, publish approval, user management, and Studio system callables.

Completed in this pass: legacy `create-job.ts` was hardened so job creation normalizes payloads before persistence, limits job kinds, bounds priority, and stores the sanitized payload instead of directly persisting arbitrary caller input.

Remaining gaps: the repo still contains multiple job concepts: `jobs`, `studioJobs`, `assetJobs`, and `exportJobs`. Those need one canonical lifecycle map before final freeze.

## Jobs pipeline

Status: partial.

The scheduled job runner can process queued and expired jobs, update state, record audit/job events, and write simple outputs. Studio system callables can create asset jobs and export jobs.

Main gap: current runner outputs are scaffolding for render, thumbnail, captions, and package export cases. This should remain feature-gated until real adapters and artifact verification are wired.

## Export pipeline

Status: partial.

Studio has export types, export creation, export status, manifest generation, Storage paths, and a new Studio-to-Spatial handoff manifest contract.

Main gap: export proof still needs real package creation, checksum/size metadata, download authorization, expiry behavior, and smoke evidence that the package can be consumed by the intended downstream system.

## Asset Factory pipeline

Status: diagnostic bridge, not live generation proof.

Asset Factory is modeled as a production-critical integration in the module registry. It is also part of the documented ecosystem chain. The expanded integration diagnostics now include Asset Factory as a tracked required external surface.

Main gap: there is no proven Asset Factory client, request/response adapter, job callback contract, artifact checksum exchange, or live smoke proof from this repo audit.

## Spatial pipeline

Status: improved and safer.

This pass added and hardened `apps/studio/lib/studio-spatial-handoff.ts`, added a Spatial handoff discovery API route, and added regression coverage. The contract keeps fallback rendering verified while advanced spatial targets require release evidence or remain unsupported.

Main gap: this proves Studio has a safer handoff contract. It does not prove live URAI Spatial consumption, real WebXR, device runtime support, or live immersive rendering.

## Content pipeline

Status: represented, not live-integrated.

Content appears in the creative module list and the ecosystem contract chain. The expanded integration diagnostics now include a Content URL slot.

Main gap: no verified `urai-content` client, content pack writer, approval flow, publishing callback, or live content smoke evidence was found in this audit pass.

## Marketing pipeline

Status: represented, not automated.

Marketing exists as an external module with a public route link and now has explicit integration diagnostics.

Main gap: no campaign payload contract, approved asset publishing flow, or live marketing handoff proof was found in this audit pass.

## Analytics pipeline

Status: represented, partially local.

Analytics exists as a module and integration diagnostic. Studio functions and API routes record local events/status. The URAI system contract names analytics as a system dependency for several capabilities.

Main gap: no verified external analytics ingestion client or live analytics smoke proof was found in this audit pass.

## Admin pipeline

Status: materially present, needs run proof.

Admin is represented in modules and routes. Functions include admin-only behavior such as asset-ready marking, and app routes include gated admin surfaces.

Main gap: final proof still needs tests for admin claims, denied access, allowed access, audit logs, and deployment settings.

## Privacy, consent, and Passport pipeline

Status: contract foundation, not full product flow.

The runtime contract defines consent requirements, safety boundaries, passport permission concepts, export control concepts, and privacy-facing system relationships. Firestore and Storage rules include server-only runtime collections and uid/member-scoped legacy collections.

Main gap: full Passport UI, consent receipt lifecycle, export/delete workflow proof, and cross-repo privacy enforcement evidence were not proven in this audit pass.

## B2B Portal and Investors pipeline

Status: documented or diagnostic only.

The ecosystem contract names B2B as part of the chain. The expanded integration diagnostics now include B2B Portal and Investors public URL checks.

Main gap: no account model handoff, B2B delivery workflow, entitlement bridge, invoice/billing proof, or investor reporting automation was proven in this audit pass.

## System map mismatches to resolve

1. `system-of-systems.ts` and `systems.ts` use broader status words such as Live, Demo, Prototype, Internal, and Planned.
2. `modules.ts` uses safer runtime statuses such as fallback and disconnected.
3. `integrations.ts` now tracks the broad external surface, but most are URL diagnostics only.
4. The contract file names V1 through V5 capabilities, but the live implementation does not prove every V1 through V5 capability.

Resolution rule: final release copy should use the most conservative status from code, tests, CI, deploy, and smoke evidence.

## Completed in this audit pass

- Hardened Studio-to-Spatial manifest validation.
- Added safer Studio-to-Spatial discovery route.
- Added/updated regression coverage around Spatial handoff behavior.
- Hardened legacy job creation payload handling.
- Added backend validation regression coverage file.
- Expanded integration diagnostics to cover Asset Factory, Spatial, Jobs, Content, Analytics, Marketing, Admin, Privacy, Investors, and B2B Portal.
- Added integration diagnostics regression coverage file.

## Done-done blockers remaining

1. Run and record the current CI/release gate on the latest commit.
2. Wire newly added standalone regression tests into the all-tests entrypoint if the connector block prevents direct editing.
3. Consolidate the multiple job models into one documented lifecycle.
4. Replace scaffold outputs with provider adapters or explicit disabled/fallback behavior.
5. Implement real export package creation with signed access and expiry.
6. Add live cross-repo smoke checks for Asset Factory, Spatial, Jobs, Content, Analytics, Marketing, Admin, Privacy, and B2B Portal.
7. Align public copy with conservative runtime evidence.
8. Record Firebase/App Hosting deploy evidence and production smoke.

## Safe current claim

URAI Studio is a real Studio app and backend foundation with system contracts, Firebase functions, diagnostics, smoke gates, and safer handoff boundaries. It is not fully live system-of-systems complete until the remaining adapters, tests, deploy proof, and live smoke evidence are recorded.
