# URAI Studio Docs Index

Updated: 2026-06-16

This index points to the current repo-side documents and machine-readable contract files that describe the Studio app, integrations, health surface, export handoff, deploy proof path, and remaining verification work.

## Core status and audit documents

- `docs/URAI_STUDIO_FULL_AUDIT.md` — full repository audit snapshot.
- `docs/URAI_STUDIO_SYSTEM_PIPELINES_AUDIT_2026-06-16.md` — system-of-systems pipeline audit.
- `docs/URAI_STUDIO_REMAINING_BLOCKERS_2026-06-16.md` — current unresolved verification and alignment items.
- `docs/URAI_STUDIO_HEALTH_READINESS.md` — health endpoint readiness contract.
- `docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md` — deploy proof record template that must be completed with observed CI, deploy, and remote smoke evidence.

## Machine-readable contract files

- `docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json` — release evidence record schema.
- `apps/studio/system/urai-studio.openapi.json` — canonical Studio OpenAPI contract.
- `apps/studio/system/spatial-handoff.discovery.json` — static Studio-to-Spatial handoff discovery manifest.
- `apps/studio/system/spatial-handoff.openapi.json` — supplemental OpenAPI fragment for the handoff endpoint.
- `apps/studio/lib/studio-spatial-handoff.ts` — TypeScript handoff contract and validators.
- `apps/studio/lib/studio/integrations.ts` — Studio ecosystem integration registry.

## Guard and test files

- `scripts/done-done-guard.mjs` — main repo-side guard.
- `scripts/evidence-schema-guard.mjs` — release evidence schema guard.
- `scripts/health-summary-guard.mjs` — health summary guard.
- `scripts/studio-smoke-v1.js` — V1 smoke gate.
- `apps/studio/tests/all.test.mjs` — auto-discovered Studio test runner.
- `apps/studio/tests/deploy-evidence-template.test.mjs` — deploy evidence template regression test.
- `apps/studio/tests/docs-index.test.mjs` — docs index regression test.
- `apps/studio/tests/env-example-ecosystem.test.mjs` — environment example and integration registry alignment test.
- `apps/studio/tests/export-handoff.test.mjs` — export handoff regression test.
- `apps/studio/tests/health-summary.test.mjs` — health summary regression test.
- `apps/studio/tests/security-surface-presence.test.mjs` — security surface presence guard.
- `apps/studio/tests/source-hygiene.test.mjs` — active source hygiene guard.
- `apps/studio/tests/spatial-handoff-discovery.test.mjs` — static handoff discovery regression test.
- `apps/studio/tests/spatial-handoff-openapi.test.mjs` — supplemental and canonical OpenAPI regression test.
- `apps/studio/tests/system-manifest-spatial-handoff.test.mjs` — system manifest handoff regression test.

## Notes

This index does not mark deployment or live smoke as complete. It is a navigation aid for the repo-side evidence and contract surfaces currently present in the repository.
