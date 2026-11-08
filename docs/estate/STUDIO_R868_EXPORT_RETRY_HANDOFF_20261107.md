# One UrAi Genesis — Studio R868 export draft retry safety and native smoke repair

**2026-11-07 UTC · review only · production HOLD.** New isolated [Studio engineering draft PR #193](https://github.com/LifeLoggerAI/urai-studio/pull/193), head `c70bea0d10accbd9d6722dbef07d0a1a9901a5d3`, stacked on R867 [#191](https://github.com/LifeLoggerAI/urai-studio/pull/191) `ca62b5a5b9a714cba34f8b9a8b513770c22a967c`. No other workers' branches or production were edited.

## New exact findings and fixes in review
- Modern `studioExports` allowed duplicate draft records on retry after a successful commit's lost HTTP response. Proposed R868 export-specific SHA256 deterministic document ID and owner/tenant/request digest, within the same R866 transaction as current user membership, Studio owner deletion/Privacy tombstone and R863 project/job/asset ownership checks.
- Export POST now requires the shared `x-urai-studio-idempotency-key` (400 if missing/invalid); identical request returns prior draft with `replayed:true`, changed request/key collision returns 409, and all rows remain `draft` with `downloadUrl` and `storagePath` undefined. No video renderer or Jobs worker activated.
- Source-level native test blocker discovered in original `apps/studio/tests/studio-export-route-smoke.test.mjs`: malformed nested quote in `src.includes('requireStudioMemberAuth(req, 'read')')`, with stale POST `requireStudioAuth(req)` expectation. Repaired to valid syntax and verified current draft membership order.
- New auto-discovered 13-case `studio-export-idempotency-r868.test.mjs` committed. Its helper direct-call `key` argument was corrected after focused first-run test failures. This checked-in file is **not** yet run from complete repository source.

## Evidence classifications and refs
- Exact `createStudioExport` function from connected GitHub is 4,572 characters/FNV1a `b40d44b7`, byte-for-byte matched local extracted function, raw SHA256 `be5e7148caf2eb2899e2def0d33558205e55bfb10436c45ceb7dbc0d3c7493f5`.
- Exact source helper Git blob `621ace1e9d8168d49c4ea3e19a3f8c10046a19b8`, local SHA256 `00427787eb84b98996d6022a33e69ac80651a19f15844d78fa1c486c59e65954`.
- Actual Node22/TS local execution against serial in-memory Firestore-like transaction: initial harness 9 PASS/2 FAIL due to helper argument naming; corrected run **11/11 PASS**, TAP SHA256 `0dabdf476b29ea119fed61ad24a6babe4abe15cb80729df98da23e33e10c8d82`. Strict isolated TypeScript transpilation/typecheck with local declaration stubs PASS; GitHub exact-source structure checks **30/30 PASS**.
- Source blobs: store `2fdcf0308c344afe9a53011f3d6a9a7dc02fc195`; public export route `d236eb782fef2e064720239ccdb4c0029383a89c`; export type `1b65b492e3daee50c018ef8c6a81f45c319cca67`; native smoke `9d2ea402a4c101b7eb2c92224bc19cbfdbe454c8`; 13-case test `8f3248b69475c9c695394ce7fdea05ec23eb140c`.
- Full report in #193: `docs/estate/STUDIO_R868_EXPORT_IDEMPOTENCY_NATIVE_REVIEW_20261107.md`. Original full Node20/pnpm9.7.0 Studio and Functions builds, actual Firebase transaction concurrency/races, CI and production **not run**; local `git ls-remote` fails DNS.

## Release HOLD — precise remaining
- Run all native original source tests including repaired smoke, 13-case new regression, whole Next.js/Functions builds, Auth+Firestore+Storage+Functions disposable emulators with simultaneous same-key requests, altered payload, revoked owner/active deletion fence between read/commit, zero forged output bytes, and exact source+log digests.
- Public export POST header change needs client migration; older internal no-key paths, cross-session replay and standalone project/brief idempotency remain open.
- R858/R859 Firestore Rules patches and stacked R860–R868 Studio API changes are still unmerged; historical `uid` projects and generic `jobs`/`jobRuns`/`deadLetters` owner deletion inventory unverified.
- Jobs P0 #252 privileged Storage post-revocation future-write denial and trusted positive Privacy C6 still HARD-OFF. Protected source→real MP4/SRT→owner-only Spatial Replay→deletion/device acceptance remains **not certified**.

No real private media, paid compute, production writes or merge. **One UrAi Genesis production HOLD.**
