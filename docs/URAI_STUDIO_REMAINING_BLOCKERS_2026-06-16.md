# URAI Studio Remaining Blockers — 2026-06-16

This note records repo-side and evidence-side blockers after the Studio completion hardening pass.

## Status

URAI Studio now has stronger repository gates for system pipelines, release evidence shape, Spatial handoff discovery, export handoff output, health readiness, fallback-only job outputs, automatic test discovery, legacy-root drift, security-surface presence, source hygiene, canonical OpenAPI route coverage, ecosystem environment-key alignment, and system manifest handoff coverage.

This document does not mark the system production complete. It records what still needs proof or follow-up before a final release lock.

## Resolved during follow-up hardening

### Ecosystem URL sample alignment

`.env.example` now includes the public URL placeholders used by the Studio ecosystem integration registry, including Jobs, Content, and B2B portal URLs. `apps/studio/tests/env-example-ecosystem.test.mjs` protects that alignment.

### Canonical OpenAPI merge for Spatial handoff

`apps/studio/system/urai-studio.openapi.json` now includes `/api/system/spatial-handoff`. `apps/studio/tests/spatial-handoff-openapi.test.mjs` checks that both the supplemental fragment and the canonical Studio OpenAPI include the handoff route.

### Health summary CI coverage

The standalone health summary guard still could not be added to `package.json` because the package-file replacement repeats existing cleanup commands. A focused workflow now exists at `.github/workflows/studio-health-guard.yml` and runs `scripts/health-summary-guard.mjs` on push, pull request, and manual dispatch.

### System manifest handoff regression coverage

The system manifest route advertises the Spatial handoff metadata, and `apps/studio/tests/system-manifest-spatial-handoff.test.mjs` now protects that block through the auto-discovered Studio test path.

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
- health summary guard result
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

### 3. Health summary guard is not wired into local package audit

`/api/system/health` now returns an integration summary, `apps/studio/tests/health-summary.test.mjs` protects it through the auto-discovered test runner, `scripts/health-summary-guard.mjs` exists, and `.github/workflows/studio-health-guard.yml` runs it in CI. The only remaining gap is local `package.json` audit wiring, which was blocked because the package-file replacement includes existing cleanup commands.

Follow-up:

- wire `scripts/health-summary-guard.mjs` into the local audit script once safe package edits are possible
- keep the focused CI workflow and auto-discovered test as baseline coverage

## Safe current claim

URAI Studio is materially more complete and more guarded than before this pass. It has stronger contracts, fallback-safe export handoff wiring, health readiness summaries, release evidence structure, source hygiene checks, OpenAPI handoff alignment, ecosystem URL-key alignment, system manifest handoff coverage, and automatic test discovery.

It is not final production-locked until CI, release, deploy, and live smoke evidence are recorded for the current commit.
