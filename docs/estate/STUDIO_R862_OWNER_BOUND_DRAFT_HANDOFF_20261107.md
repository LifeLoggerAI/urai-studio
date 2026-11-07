# One UrAi Genesis — Studio R862 owner-bound draft continuation

**2026-11-07; production HOLD.** New stacked engineering draft [Studio #186](https://github.com/LifeLoggerAI/urai-studio/pull/186), head `eadab9fc521520496702d451f9cdc60db92d49d0`, based on unmerged R861 [#185](https://github.com/LifeLoggerAI/urai-studio/pull/185) `2db179f0c69943d032bc94a871ad974e82f5d44a` (which descends from R860 and exact Studio #179). No other worker branch overwritten.

## New source repair proposed
- R861 job and optional prompt brief atomic batch becomes a **single Firestore Admin transaction** that first authorizes existing project (exact tenantId/userId) and optional referenced existing brief (tenantId/userId/projectId), then atomically creates job and prompt brief. Denials: `studio_project_not_found`, `studio_project_forbidden`, `studio_brief_not_found`, `studio_brief_forbidden`.
- No project ID: preserve Video Factory's implicit new-project flow by atomically creating a real `StudioProject` with current owner/tenant together with the unexecuted draft. Does not start a renderer or create private outputs.
- New `apps/studio/lib/studio-runtime-store.ts` Git blob `1cb7e491619a95015f39ff433a668ef46fb6e018`; updated original `apps/studio/tests/studio-atomic-job-brief-r861.test.mjs` Git blob `140881d0fa614a466628ee355e935a721ffbae89`.
- Detailed review ledger: `docs/estate/STUDIO_R862_OWNER_BOUND_DRAFT_REVIEW_20261107.md` inside #186.

## Evidence
**17/17 connected GitHub source assertions PASS** for transaction, project/brief owner/tenant/project checks, implicit owner project and unchanged contract-only status. Updated synthetic tests were committed but **NOT EXECUTED** in R862. Previous R861 6/6 Node synthetic tests are historical and **do not certify** changed transaction source. No full app typecheck/build/CI, Firebase emulator, cloud project permissions or private movie runtime passed in this continuation.

## Newly emphasized follow-up
- Existing standalone `createStudioProject` permits caller-ID upsert `.set(merge:true)` without project ownership check — separate possible collision/cross-owner metadata overwrite surface.
- Existing standalone `createStudioBrief` and `createStudioExport` lack verified project/asset/job ownership admission; R862 only addresses `createStudioJob`. Avoid describing all Studio endpoints as owner-safe.
- Idempotent retries after committed transactions with lost HTTP receipts, legacy queued/draft compatibility, older collections' deletion and cross-service Jobs mapping remain unverified.
- R858 #182, R859 #183, R860 #184, R861 #185 and R862 #186 are **unmerged, review-only**, not a deployed source convergence. Jobs P0 #252 privileged Storage future-write fence and positive signed Privacy C6 remain HARD_OFF. Actual private movie render/owner-only Replay/revocation/deletion and independent physical device GO are not certified.

**Next exact acceptance:** Node20/pnpm9.7.0 frozen Studio suites and Functions builds on #186, native four-emulator owner/project/brief and race/transaction acceptance, owner-safe project upsert/export with independent review, then idempotency and production integration only after Jobs/Privacy release gates. No paid resources, real private media, branch merges or deployment performed.
