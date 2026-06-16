# URAI Studio Remaining Blockers — 2026-06-16

This note records the remaining repo-side and evidence-side blockers after the Studio completion hardening pass.

## Status

URAI Studio now has stronger repository gates for system pipelines, release evidence shape, Spatial handoff discovery, export handoff output, health readiness, fallback-only job outputs, automatic test discovery, legacy-root drift, and security-surface presence.

This document does not mark the system production complete. It records what still needs proof or follow-up edits before a final release lock.

## Remaining blockers

### 1. Current CI status is not proven

GitHub status checks have not returned a completed result for the latest commits during this pass. Do not claim CI is green until GitHub Actions reports the workflow result.

Required evidence:

- install result
- lint result
- typecheck result
- Studio tests result
- app build result
- Functions build result
- done-done guard result
- evidence guard result
- Studio smoke result

### 2. Live deployment proof is not recorded

No live deploy or live smoke proof was available from the connector session.

Required evidence:

- deployment target
- deployed commit SHA
- production URL
- live health response
- live system manifest response
- live Studio export handoff response

### 3. `.env.example` still lags the ecosystem URL docs

README and `docs/URAI_STUDIO_ECOSYSTEM_URL_KEYS.md` document the expanded ecosystem URL surface. Direct edits to `.env.example` were blocked in the connector session, so the sample file may still lag behind those docs.

Follow-up:

- align `.env.example` with the ecosystem URL-key doc
- avoid adding private values
- keep placeholders empty or clearly local-only

### 4. Main OpenAPI file still needs merge with the supplemental Spatial handoff fragment

The supplemental contract exists at `apps/studio/system/spatial-handoff.openapi.json`, and it is covered by an auto-discovered test. Direct edits to the main OpenAPI JSON were blocked.

Follow-up:

- merge the Spatial handoff route into the main OpenAPI JSON
- keep the supplemental fragment until the merged spec is validated

### 5. Health summary guard exists but is not wired into all release commands

`/api/system/health` now returns an integration summary, and `apps/studio/tests/health-summary.test.mjs` protects it through the auto-discovered test runner. The standalone guard exists at `scripts/health-summary-guard.mjs`, but package/workflow wiring was blocked.

Follow-up:

- wire the guard into local audit scripts or CI once edits are allowed
- keep the auto-discovered test as baseline coverage

### 6. System manifest handoff block needs stronger direct regression coverage

The system manifest route now advertises the Spatial handoff metadata. Direct manifest-specific tests were blocked, so this should be covered by a focused test or smoke check in a later pass.

Follow-up:

- add a manifest regression test once connector filtering allows it
- or add a smaller route-contract guard that does not duplicate blocked strings

## Safe current claim

URAI Studio is materially more complete and more guarded than before this pass. It has stronger contracts, fallback-safe export handoff wiring, health readiness summaries, release evidence structure, and automatic test discovery.

It is not final production-locked until CI, release, deploy, and live smoke evidence are recorded for the current commit.
