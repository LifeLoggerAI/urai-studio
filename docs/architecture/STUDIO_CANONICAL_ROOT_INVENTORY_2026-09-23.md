# URAI Studio Canonical Root Inventory — 2026-09-23

Issue authority: `LifeLoggerAI/urai-studio#27`.

## Production authority

Canonical production application: `apps/studio`.

Canonical runtime roots:

- `apps/studio/app`
- `apps/studio/components`
- `apps/studio/lib`
- `functions` for Firebase Functions

## Removed active duplicates

This cleanup removes:

- the complete `apps/studio/src/` tree because `apps/studio/tsconfig.json` explicitly excludes `src`;
- root `src/components/studio/JobStatePill.tsx`;
- root `src/components/studio/StudioShell.tsx`;
- root `src/lib/firebaseClient.ts`;
- root `src/lib/studioTypes.ts`.

Repository search found no canonical active imports of those root duplicates. Historical imports are already contained under `archive/`.

## Retained non-production evidence/reference areas

### `archive/`

Retained intentionally. It contains deprecated roots, backup artifacts and historical implementation evidence. It is not production source and must not be patched as current runtime.

### `apps/docs`

Retained as a workspace documentation application. It does not compete with `apps/studio` for Studio runtime authority.

### `brain-map-ui/`

Retained as a research/reference artifact. Production Brain Map authority must be implemented through the governed Studio contracts rather than assuming this historical UI is live.

### `src/urai-foundation/wave1-foundation.js`

Retained because `docs/URAI_STUDIO_WAVE1_POLISH_STATUS.md` explicitly references it as historical Wave 1 evidence. It is not in the pnpm workspace and has no Studio production-app authority.

## Guard rule

A second active Studio application root is prohibited. Any recovered historical implementation must be migrated into `apps/studio` and re-tested rather than revived in place.

This source cleanup does not delete Git history and does not change deployment, provider, publishing, billing or runtime activation authority.
