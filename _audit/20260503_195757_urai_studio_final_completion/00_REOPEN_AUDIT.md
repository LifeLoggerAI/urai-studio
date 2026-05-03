# Reopen Audit
- Project root: /workspace/urai-studio
- Package manager: pnpm monorepo (apps/*, packages/*)
- Branch/latest commit: work @ 727ce3e
- Working tree: clean
- Framework: Next.js App Router (apps/studio), Next 16.1.6

## Route map
Core: /, /studio, /system, /status, /dashboard
Creative: /assets, /assets/[id], /asset-factory, /motion, /cinema, /music, /visuals, /content, /spatial
Ops: /admin, /jobs, /usage, /analytics, /integrations, /settings
Legacy studio routes still present: /studio/home, /studio/dlq, /studio/replay, etc.

## API route map
- /api/system/health
- /api/system/manifest
- /api/system/capabilities
- /api/system/integration-contract
- /api/system/openapi
- /api/integrations/asset-factory/health
- /api/integrations/asset-factory/manifest

## Firebase summary
- firebase.json hosting.source=apps/studio, functions.source=functions
- .firebaserc default project=urai-studio, hosting target default->urai-studio
- firestore.rules and storage.rules exist
- env example exists at apps/studio/.env.example

## Current status
- typecheck: PASS
- lint: FAIL (33 errors) across app/schemas, app/studio/* and many src/* legacy files
- test: PASS (minimal)
- build: PASS

## Regressions from prior pass
- Rich pages replaced by minimal placeholder pages for key routes.
- StudioShell moved out of active app usage; previous richer src/components/studio/StudioShell exists but disconnected.
- Login route reduced; auth wiring largely removed from app pages.
- tests are shallow and do not validate API contract shapes deeply.

## Production gaps
1. Canonical module type missing required fields (inputs/outputs/capabilities/fallbackBehavior/productionCritical).
2. UI shell not production-grade; module pages too shallow.
3. API endpoints missing required warning/modules data in health and fuller capabilities set.
4. Lint failing due legacy src tree not excluded/safely integrated.
5. Docs incomplete for production readiness detail.

## Repair plan
1. Build reusable studio components + route-aware shell and real module overview pages.
2. Expand canonical typed registry and ensure pages + APIs read same registry.
3. Harden system endpoints + OpenAPI schema.
4. Fix lint by scoping to active app/lib/tests and repairing active-file issues.
5. Strengthen tests (registry + openapi + API shape builders).
6. Run required command sequence incl smoke and local API/page checks.
7. Update docs + final proof report with honest status.
