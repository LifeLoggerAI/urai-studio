# URAI Studio Done-Done Lock

Status: canonical production hardening contract
Owner: URAI Studio
Canonical app: `apps/studio`
Runtime: Node `>=20 <21`, pnpm `9.7.0`

This file is the repo-level lock for what it means for URAI Studio to be done-done. It intentionally separates the current production shell from the full URAI system-of-systems target so the repository cannot drift into calling incomplete, feature-gated, or duplicated systems complete.

## 1. Canonical production shape

The canonical production surface is:

- `apps/studio` - Next.js Studio web app and public/studio routes.
- `functions` - Firebase Cloud Functions.
- `packages/*` - shared workspace packages.
- `.github/workflows/*` - CI and production verification.
- `docs/contracts/*` - ecosystem contracts and handoff documents.
- `apphosting.yaml` - Firebase App Hosting runtime configuration.

Everything else is non-canonical unless it is explicitly referenced from the canonical app, functions, packages, or docs/contracts layer.

## 2. Deprecated or historical surfaces

These paths must not be treated as production app roots unless a later migration document explicitly promotes them:

- `uraistudio-app/**`
- root `app/**`
- root `studio/**`
- `*.bak*`
- `firebase.json.bak*`
- `_audit/**` runtime copies
- `.ai-backups/**`
- any path containing `broken`, `backup`, `stale`, `ship_lock`, or `staging_lock` outside a clearly archived docs context

Production imports from deprecated surfaces are blockers.

## 3. Done-done definition

URAI Studio is not done-done merely because the public shell builds or smoke tests pass. It is done-done only when all of the following are true.

### Standalone Studio product

- Real authenticated project creation exists.
- Real `StudioJob` queue exists.
- Real generation provider integration exists.
- Real asset output persistence exists.
- Real export/download flow exists.
- Real billing is configured and verified.
- Tenant/user scoping is enforced on dashboards, jobs, assets, exports, and admin routes.
- Contact/waitlist fallback behavior is not confused with production persistence.

### URAI system-of-systems integration

- URAI Studio, URAI app, URAI Spatial, URAI Privacy, URAI Foundation, URAI Analytics, Asset Factory, URAI Passport, and Council/Narrator all share typed contracts.
- V1 through V5 capability contracts exist and are versioned.
- Every capability declares data dependencies, consent dependencies, renderer dependencies, export paths, safety limits, and acceptance tests.

### Genesis / V1 non-negotiables

- True 3D is the core runtime, not a decorative layer.
- Ground, orb, sky, chat, mood weather, Council, Passport, permissions, sound, and polished navigation are integrated.
- User-facing routes contain no debug, test, placeholder, or internal lock language.

### Privacy / Passport

- Passport is a first-class route, schema, and API contract.
- Consent gates all sensitive signals and all derived inferences.
- Export, deletion, retention, and audit receipt flows are defined.
- Sensitive mental-health, trust, relationship, and behavioral inferences include uncertainty language and explainability.

### Spatial / XR

- Studio can export a scene contract consumed by URAI Spatial.
- WebXR handoff is validated through a canonical runtime path.
- Broken, backup, audit, and old lock-repair trees are excluded from production packaging.

## 4. CI gates that should exist

The repo should fail CI when:

- production code imports from deprecated roots;
- user-facing routes contain `TODO`, `placeholder`, `debug`, `test mode`, or raw demo copy;
- Firebase is initialized from multiple non-canonical client/admin paths;
- system contracts are missing required V1-V5 capability keys;
- StudioJob, StudioAsset, StudioExport, Passport, or Consent schemas are missing;
- generation or billing routes are exposed without safe feature gates or real configuration;
- private dashboards, generated downloads, or admin routes lack tenant enforcement;
- WebXR/Spatial contracts drift from the Studio export manifest.

## 5. Build order from this lock

1. Consolidate canonical paths and archive historical roots.
2. Add CI guard for deprecated imports and user-facing internal labels.
3. Consolidate Firebase client/admin initialization.
4. Add typed StudioJob, StudioAsset, StudioExport, Passport, Consent, and V1-V5 capability schemas.
5. Wire a safe job queue and generation adapter.
6. Wire export/download authorization.
7. Wire Passport and consent receipts.
8. Wire Studio-to-Spatial scene handoff.
9. Wire billing and usage metering.
10. Run production smoke, typecheck, tests, and deployment verification.

## 6. Final lock statement

Until every gate above is implemented or intentionally feature-gated with visible engineering acceptance criteria, URAI Studio should be described as a hardened Studio shell and integration foundation, not the fully complete URAI Studio system-of-systems.
