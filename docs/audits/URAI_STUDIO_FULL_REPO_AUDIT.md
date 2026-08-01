# URAI Studio Full Repository Audit

Audit date: 2026-07-06  
Repository: `LifeLoggerAI/urai-studio`  
Canonical branch: `main`  
Audited head: `4a1ce1bf39c821212f5b7565453761d85aad545c`  
Audit branch: `audit/urai-studio-v50-v200-20260706`

## Executive finding

URAI Studio is a substantial Next.js/Firebase foundation, not an empty shell. It has a canonical application (`apps/studio`), Cloud Functions (`functions`), Firestore and Storage rules, system and integration contracts, public and operator routes, release guards, HTTP smoke tests, and Firebase deployment configuration.

It is not yet a complete production operating platform. The current repository proves fallback-mode orchestration and contract surfaces, but it does not prove provider-backed generation, durable export packages, complete tenant authorization, cross-repository execution, deployed-sha traceability, or a passing release run for the current head.

## Repository truth

| Item | Verified state | Evidence |
| --- | --- | --- |
| Default branch | `main` | repository metadata |
| Canonical app | `apps/studio` | `README.md`, `ARCHITECTURE.md`, `firebase.json` |
| Canonical backend | `functions` | `README.md`, `functions/src/index.ts` |
| Runtime | Node `>=20 <21`; Functions/App Hosting Node 20 | `package.json`, `functions/package.json`, `apphosting.yaml` |
| Package manager | pnpm `9.7.0` | root and Studio `package.json` |
| Framework | Next `16.1.6`, React 19 | `apps/studio/package.json` |
| Firebase project alias | `urai-studio` | `.firebaserc` |
| Configured public URL | `https://www.uraistudio.com` | `README.md`, `apphosting.yaml` |
| Current-head CI proof | Missing | no combined statuses attached to audited head; no current-head run evidence recorded |
| Deployment proof | Missing | `docs/URAI_STUDIO_RELEASE_EVIDENCE.md` remains pending |
| Deployed SHA / rollback SHA | Not proven | no immutable deployment receipt in repository evidence |

## Confirmed working or materially implemented

- Workspace scripts for lint, typecheck, tests, build, Functions build, guards, smoke, and release checks.
- CI workflow on pushes and pull requests to `main`, using Node 20, frozen-lockfile install, release checks, production server startup, and HTTP smoke (`.github/workflows/studio-ci.yml`).
- Real HTTP smoke script covering public pages, system APIs, protected API behavior, metadata, placeholder detection, readiness, and form validation (`scripts/smoke.sh`).
- Firebase Admin-backed runtime store for projects, briefs, jobs, and exports (`apps/studio/lib/studio-runtime-store.ts`).
- Authenticated callable functions for project, asset-job, export, dashboard, and event operations (`functions/src/studio-system.ts`).
- Strict validation and project ownership checks in the legacy `createJob` callable (`functions/src/create-job.ts`).
- Baseline security headers, with CSP currently report-only (`apps/studio/next.config.ts`).
- Public and operator route inventory with a broad Studio shell and diagnostics surfaces.

## Present but unverified

- Clean install and reproducible build on current head.
- Functions TypeScript build after the current audit fixes.
- Firestore and Storage rules behavior under emulator tests.
- Production Firebase Admin credential mode.
- Custom-domain deployment and `/readyz` returning 200 in production.
- Contact/waitlist persistence in the production Firebase project.
- Browser E2E, accessibility, visual regression, performance, and mobile validation.

## Partial, fallback, or disconnected

- The scheduled job runner writes explicit fallback text/SRT/JSON artifacts and marks them not ready for external use (`functions/src/job-runner.ts`).
- Script, narration, and subtitle callables create deterministic scaffold text, not provider-generated media (`functions/src/studio-system.ts`).
- Export processing marks a Firestore manifest ready but does not write and authorize a complete downloadable package.
- Integration diagnostics mostly prove configured URLs, not authenticated request/response contracts (`apps/studio/lib/studio/integrations.ts`).
- Most module registry entries are `fallback` or `disconnected` (`apps/studio/lib/studio/modules.ts`).
- `brain-map-ui/src/BrainMap.tsx` is outside the canonical app, hard-codes nodes/edges, and states that API connection is future work. It is not a shipped Studio route.

## P0 findings

1. **Production tenant scope accepted caller influence.** Before this audit branch, a verified token without a tenant claim could fall back to `x-urai-tenant-id`. The branch binds fallback scope to `decoded.uid` instead.
2. **Maximum-attempt jobs could continue into processing.** The runner marked a job failed inside a transaction and then continued to `processJob`. The branch now exits before processing and records terminal evidence.
3. **Membership self-escalation risk in Firestore rules.** Any signed-in user can create or update a membership document under their own ID prefix without an invitation/owner authorization check. Because role values are not constrained, this can confer membership or owner-like authority for an existing studio. This requires a rules redesign plus emulator tests before merge.
4. **No current-head release evidence.** The current `main` head has no attached combined status checks and the release ledger still marks install/build/deploy/live smoke pending.

## P1 findings

- Production readiness ignores several integrations marked production-critical in the module/integration registries.
- API job kind and export kind validation is not consistently enforced at request boundaries.
- Multiple overlapping data models exist (`jobs`/`studioJobs`/`assetJobs`; `projects`/`studioProjects`; `exports`/`exportJobs`/`studioExports`).
- No durable idempotency key, dead-letter collection flow, bounded batch size, or provider cost receipt is proven.
- No signed download authorization, checksum, retention, deletion, or recovery path is implemented for exports.
- Cross-repository handoffs are contracts/discovery documents rather than proven authenticated calls.

## Production and rollback conclusion

Configuration names a Firebase project and public domain, but configuration is not deployment evidence. The repository does not currently prove the production deployed SHA, immutable artifact digest, last-known-good SHA, or an exercised rollback. Release status is therefore **not production-frozen**.

## Drive evidence treatment

Google Drive contains broader URAI product, governance, visual, market-signal, and foundation materials. Those files inform intended outcomes but do not override repository truth. No Drive document inspected in this pass was treated as proof that a Studio feature is implemented, tested, deployed, or live.

## Completion score basis

Scores in the roadmap are evidence bands, not precise measurements: implemented and connected code receives more credit than documents or route presence; fallback/mock behavior receives partial credit; unrun tests and unproved deployments receive no execution credit.
