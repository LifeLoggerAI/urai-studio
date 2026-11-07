# One UrAi Genesis — Studio R861 atomic generation-draft persistence

**Date:** 2026-11-07. **Review-only, not merged/deployed.** Parent: R860 draft-only candidate `085573ca9ac36cc594a3b0bf267aff5255c43e3c`, which itself derives from Studio movie source #179 `153d6c35557c66a8b9f8629778ca796b83730464`. Protected private Life Movie **HOLD**.

## Root cause confirmed in actual source
Original `apps/studio/lib/studio-runtime-store.ts` `createStudioJob()`:
1. Admin `.set(job, {merge:true})` on `studioJobs`
2. Separately `await createStudioBrief()` when a prompt exists, writing `studioBriefs`.
3. If the second write fails, the first job may persist while POST rejects; a retry may create duplicate draft records without clear reconciliation.

The existing new-render path is `provider:'feature-gated'`, `model:'contract-only'` and requires no private source bytes; the correction must **not** create a rendering worker or consent grant.

## Precise isolated repair
- Changes only `apps/studio/lib/studio-runtime-store.ts` function `createStudioJob()` and adds `apps/studio/tests/studio-atomic-job-brief-r861.test.mjs`.
- Prepare `StudioJob` and optional typed `StudioBrief` in memory first, retaining common owner, tenant, project and timestamp.
- Associate the new `job.briefId` with the actual prompt brief's ID; preserve caller `briefId` when there is no prompt.
- Commit via one `adminDb.batch()`: `batch.create(studioJobs/jobId, job)`, optional `batch.create(studioBriefs/briefId, brief)`, `await batch.commit()`. No duplicate orphan from **one failed atomic commit**. No job is enqueued or output created.
- Explicit compatibility point: supplying both an old `briefId` and a new `prompt` now binds the newly written prompt brief; previously the old ID remained on the job and the newly written prompt brief was orphaned. Independently review API caller expectations before merge.

## Executed evidence
- Connected GitHub exact source readback: `studio-runtime-store.ts` Git blob `3bb16a52aa2f5ea1fd0c1debbb765a6f42105ef9`. The 2,258-character/byte function was reconstituted locally and its FNV1a `0ff4bec3` matched the exact connected-GitHub function extract. Standalone raw SHA256 `7b7f5c607d6619f4e28ecb532110e7645a64725b9b9c33085c151963b0ede622`.
- Local **Node 22.16.0 real execution**: transpiled the exact extracted `createStudioJob()` with globally installed TypeScript and executed against a synthetic transactional Admin batch. **6/6 PASS**, no fails/skips. Tests: job+brief linked atomic commit, no-prompt single-write preserves `briefId`, commit failure zero writes, unconfigured Admin no writes, no output/consent claims, prompt+old-brief compatibility behavior.
- Executed test harness raw SHA256 `e658bac4cc1e897f1129746fbfdcce01d30a771e4749124624c4db7a302d0a7e`; TAP SHA256 `4293986189e3563c29fe7c10d2deb89718799e0266ec8bafa63f4f3d22fc53aa`.
- Strict `tsc --noEmit --strict --target es2022` **PASS** for extracted function + local type declarations (synthetic type model, **NOT** full source workspace typecheck). Typecheck fixture SHA256 `25152a0aaab532362acd2d584a33d7c4e58fadb12e99123a6612c11f50553c80`.
- Repository regression `apps/studio/tests/studio-atomic-job-brief-r861.test.mjs` uses TypeScript AST to transpile the **checked-in original function** and exercises same six cases with a simulated atomic batch. It is auto-discovered by existing `apps/studio/tests/all.test.mjs`. **This checked-in regression was not run in full repo locally** due unavailable full checkout/pnpm.
- No native Firebase emulator/GCS, cloud IAM, authenticated owner-media execution, original app/Functions Node20 frozen build or CI run was performed. A simulated batch proves code branching; it does not independently certify Firestore transaction semantics or production permissions.

## Important remaining risks / exact tests
1. **P0**: trusted Privacy C6 grant and Jobs issue #252 durable Storage-enforced post-revoke future-write denial; real private movie, Replay, deletion remain off.
2. **P1**: caller retry/idempotency keys and transaction outcome ambiguity; if a successful commit's HTTP receipt is lost, a retry still creates another draft. Add tenant/owner/request-bound idempotency and conflict tests in a separate reviewed PR.
3. **P1**: project/brief ownership: current Studio POST and Admin `createStudioJob` accept a requested `projectId`/existing `briefId` without verifying that each belongs to the authenticated actor's tenant. Atomic commits do not prevent unauthorized cross-project metadata references. No private media output yet, but ownership authorization is required before worker admission.
4. **P1**: original full `pnpm --filter studio test`, typecheck, build, Functions build and authenticated emulators on exact branch, including simulated Firestore partial failures and service-account checks; preserve source/head/lockfile/runtime/log SHA256.
5. **P1**: reconciliation of legacy `jobs`, `jobRuns`, `deadLetters` versus modern `studioJobs`/data rights and separate R858/R859 security PRs before production.

**No paid compute, real private media, production deployment, worker enablement, consent issuance, other-worker branch edits, or main merges performed.**
