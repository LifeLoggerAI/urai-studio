# URAI Studio Health Readiness Contract

Date: 2026-06-16
Repository: `LifeLoggerAI/urai-studio`
Status: repo-side readiness contract, not live smoke proof

## Purpose

`/api/system/health` is the quick readiness surface for URAI Studio. It must show whether the Studio app can report its own state and whether the configured ecosystem integrations are present enough for a release decision.

## Required response fields

The health route must keep these fields:

- `ok`
- `service`
- `version`
- `environment`
- `timestamp`
- `checks`
- `studioIntegrations`
- `configuredIntegrations`
- `missingIntegrations`
- `requiredMissingIntegrations`
- `integrationSummary`

## Integration summary contract

`integrationSummary` must expose:

- `total`
- `configured`
- `missing`
- `requiredMissing`
- `requiredMissingIds`

This lets release checks and humans quickly see whether required ecosystem surfaces are absent without hand-parsing the full integration list.

## Guard coverage

- `apps/studio/tests/health-summary.test.mjs` is auto-discovered by `apps/studio/tests/all.test.mjs`.
- `scripts/health-summary-guard.mjs` can be run directly for a focused health summary check.

## Release boundary

This contract does not prove the live site is healthy. Live readiness still requires a recorded release evidence file and a live smoke run against the deployed host.
