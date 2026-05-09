# URAI Studio Handoff

## Current State

This repo now includes the URAI Studio enforcement layer requested by the full-system audit prompt. The implementation is intentionally strict: it adds real code and contracts where possible, but does not claim release lock because the full verification chain has not yet passed in a network-enabled checkout.

## What Is Implemented

- Studio callable functions for project creation, demo seeding, narrator scripts, scene narration, subtitles, companion intro generation, asset jobs, export jobs, dashboard summaries, and event logging.
- Firebase Functions v2 callable compatibility in `functions/src/studio-system.ts`.
- Functions index export coverage.
- Client-side callable wrapper and Studio action panel wiring.
- Studio route surfaces for projects, assets, exports, admin, settings, and XR readiness.
- Public module routes with metadata/canonical coverage.
- Legal/static/public pages with metadata/canonical coverage.
- Waitlist client/server boundary split.
- Contact and waitlist submission APIs with validation, no-store responses, and Firebase Admin persistence fallback.
- Firestore rules for user-owned Studio collections.
- Firestore rules denying client SDK access to `waitlist` and `contactMessages`.
- Storage rules for owner-owned uploads, server-generated outputs, public read-only assets, and membership-gated studio paths.
- Firestore indexes for authenticated Studio query patterns.
- System API routes for health, manifest, capabilities, OpenAPI, integrations, readiness, liveness, and Asset Factory health.
- Static smoke test with broad file, route, callable, rules, docs, and CI contract checks.
- GitHub Actions workflow for the required audit chain.
- Documentation artifacts required by the audit prompt.

## Key Files

- `functions/src/studio-system.ts`
- `functions/src/index.ts`
- `apps/studio/lib/studio/firebase-client.ts`
- `apps/studio/components/studio/StudioActionPanel.tsx`
- `apps/studio/components/studio/ModuleOverviewPage.tsx`
- `apps/studio/app/api/**/route.ts`
- `apps/studio/app/studio/**/page.tsx`
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`
- `scripts/studio-smoke-test.js`
- `.github/workflows/studio-audit.yml`
- `.env.example`
- `SYSTEM_MAP.md`
- `AUDIT_REPORT.md`
- `FIREBASE.md`
- `TESTING.md`
- `RELEASE_NOTES.md`
- `FINAL_AUDIT_REPORT.md`

## Required Verification Commands

Run from the repository root in a network-enabled checkout:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions install --no-frozen-lockfile
pnpm --dir functions build
pnpm studio:smoke
```

## Next Engineering Steps

1. Run the full verification command set in GitHub Actions, Firebase Studio, Codespaces, or a local checkout.
2. Fix any issues surfaced by lint, typecheck, app build, functions build, tests, or smoke check.
3. Run emulator or deployed-project QA for live callables and form submissions.
4. Review GitHub Actions logs and confirm all required checks pass.
5. Only after verification passes, create `LOCK.md` with exact passing command results and release metadata.
6. Deploy with Firebase only after release lock conditions are met.

## Handoff Warning

Do not mark the repo release-locked, production-ready, fully verified, or complete until the verification commands pass. `LOCK.md` is intentionally absent until then.
