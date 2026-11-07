# One UrAi Genesis — Studio R863 owner-safe project, brief, export handoff

**2026-11-07 UTC — review-only; production HOLD.** New separate stacked engineering [Studio #187](https://github.com/LifeLoggerAI/urai-studio/pull/187), head `d7081d58a14ff71dfdbd4f3d811f2abe49946573`, based on R862 [#186](https://github.com/LifeLoggerAI/urai-studio/pull/186) `eadab9fc521520496702d451f9cdc60db92d49d0`. Neither branch merged/deployed; Genesis remains documents only.

## What was actually fixed in proposed source
- `createStudioProject` now rejects malformed caller document IDs and uses create-only semantics rather than `set(...,{merge:true})` that could overwrite an existing owner's project.
- Standalone `createStudioBrief` checks exact project `tenantId` and `userId` inside the Firestore transaction that creates the brief; no inherited project authorization from arbitrary IDs.
- Standalone `createStudioExport` checks project, optional job and every source asset against exact `tenantId`, `userId`, `projectId` inside the same transaction as draft creation. Invalid/duplicate/greater-than-25 asset refs denied. Export remains `draft`, no media URL or worker admission.
- Existing old Callable `functions/src/studio-system.ts` project shape uses `uid` rather than modern `StudioProject` `tenantId`/`userId`/name fields. This is a genuine **schema/compatibility conflict**, not authority to reinterpret legacy records as owner-admitted. Reconcile with signed original owner and migration proof; avoid production edits.

## Evidence and exact refs
- Source `apps/studio/lib/studio-runtime-store.ts` Git blob `7f3dfdd21953eb6db9f11eaaf9361f62e5257d16`.
- New `apps/studio/tests/studio-owner-safe-records-r863.test.mjs` blob `3e2fa8d28d8fd4084e541ed04a43b9003fd9fd12` with **13** synthetic transaction test declarations; they are committed and expected to be auto-discovered, **NOT RUN in this continuation**.
- 24/24 connected GitHub source assertions PASS for create-only, authorization read/write ordering, bounded IDs, no fake outputs and test coverage; only static checks, NOT native Firebase Rules/SDK acceptance.
- Full engineering source/audit: `docs/estate/STUDIO_R863_OWNER_PROJECT_EXPORT_REVIEW_20261107.md` in #187.
- Local Node22 and TypeScript present, but native full source checkout via GitHub/npm DNS blocked; no pnpm/Firebase CLI or provider connection used. No build, emulators, cost, production writes, private media or GO.

## Blocking integration list
1. Read `apps/studio/lib/studio-auth.ts`: in production when token has neither `tenantId` nor `studioId`, it falls back to caller-controlled `x-urai-tenant-id`. The newer owner checks compare this tenant and decoded uid, but trustworthy tenant membership issuer and legacy uid migration remain unverified. Require real sign-in/tenant claim acceptance, not header-based membership assumption.
2. R862 job ownership and R863 standalone resource references need actual Firebase transaction/Rules tests and public API error mapping/legacy compatibility review.
3. **Retry idempotency still absent**; successful transaction with lost HTTP receipt can produce duplicate drafts. Test exact actor+tenant+request body hash and idempotency admission with replay of existing receipt.
4. Original `functions/src/studio-system.ts` callable `exportJobs`/historical project shape is separate from modern `studioExports`/modern projects; do not claim unified jobs, device owner output, or complete data rights/deletion.
5. R858 #182 and R859 #183 server-owned Jobs/audit/worker evidence security patches are still unmerged; original native emulator/CI execution required. Jobs P0 #252 privileged Storage write post-revocation fence and positive signed Privacy C6 are still HARD-OFF. No verified real private Life Movie→owner-only Replay→revocation/deletion.

**Next genuine acceptance:** clean Node20/pnpm9.7.0 frozen original tests + builds, four disposable Firebase emulators with real owner/foreign owner/missing refs/legacy schema, and cross-service Jobs/Privacy fence before private rendering. Maintain production HOLD.
