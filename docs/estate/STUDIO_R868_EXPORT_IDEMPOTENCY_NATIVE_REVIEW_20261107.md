# One UrAi Genesis — Studio R868 export idempotency and native-syntax repair

**2026-11-07. Production HOLD.** Isolated proposed engineering change stacked on R867 [Studio #191](https://github.com/LifeLoggerAI/urai-studio/pull/191) at exact commit `ca62b5a5b9a714cba34f8b9a8b513770c22a967c`. Nothing merged/deployed; no customer media, paid compute or secrets.

## Root cause
- R867 made two contract-only movie/job draft POST routes idempotent, but **`POST /api/studio/exports`** still used a random `studioExports` ID on every retry. A successful commit with a lost HTTP response could create duplicate owner-owned export drafts, even though no output was rendered.
- The original R865-modified `apps/studio/tests/studio-export-route-smoke.test.mjs` had an invalid literal `src.includes('requireStudioMemberAuth(req, 'read')')` and looked for the obsolete `requireStudioAuth(req)` in the POST. It was a native JavaScript parser blocker, not passing authorization test evidence.

## Narrow R868 changes
1. The existing `studio-draft-idempotency.ts` now provides `deriveStudioExportReceipt`, with an **export-specific** versioned namespace and actor/tenant/request-key SHA-256 document ID. It includes project ID, optional job ID, ordered asset IDs and export kind in its separate request digest; raw keys are never stored.
2. `createStudioExport` retains R866 transaction-bound current role/membership/deletion authority and R863 owner-scope checks on project/job/asset refs. It first reads deterministic `studioExports/{id}` within that transaction, refuses owner/tenant/digest/status/output mismatches, then rechecks every source reference before returning the original `draft` with `replayed:true` and no new writes. Otherwise an initial transaction creates one draft and returns `replayed:false`. Changed payload => explicit `studio_idempotency_conflict`.
3. `StudioExport` type gains optional digest-only idempotency fields for legacy record compatibility. The authenticated export POST requires the same valid `x-urai-studio-idempotency-key` header used for job drafts (400 when absent/invalid), returns HTTP 409 on conflicting reuse, exposes `replayed` on success and retains `spatialHandoff` as a **fallback-only** manifest, not verified rendered media.
4. Fixes the existing export smoke test's JavaScript syntax and updates its POST authorization query to R865's current `requireStudioMemberAuth(req, 'draft')`. Adds `studio-export-idempotency-r868.test.mjs` with 13 native Node test declarations auto-discovered by `apps/studio/tests/all.test.mjs`. Its direct helper tests were corrected to pass `key`, not the store-level `idempotencyKey` field.

## Exact source refs / bytes
| Git-tracked file | Git blob SHA |
| --- | --- |
| `apps/studio/lib/studio-draft-idempotency.ts` | `621ace1e9d8168d49c4ea3e19a3f8c10046a19b8` |
| `apps/studio/lib/studio-runtime-store.ts` | `2fdcf0308c344afe9a53011f3d6a9a7dc02fc195` |
| `apps/studio/lib/urai-system-contract.ts` | `1b65b492e3daee50c018ef8c6a81f45c319cca67` |
| `apps/studio/app/api/studio/exports/route.ts` | `d236eb782fef2e064720239ccdb4c0029383a89c` |
| `apps/studio/tests/studio-export-route-smoke.test.mjs` | `9d2ea402a4c101b7eb2c92224bc19cbfdbe454c8` |
| `apps/studio/tests/studio-export-idempotency-r868.test.mjs` | `8f3248b69475c9c695394ce7fdea05ec23eb140c` |

## Executed evidence (strict classification)
- The exact `createStudioExport` TypeScript function, extracted from `2fdcf0...`, is **4,572 UTF-8 bytes**. Local copy `/mnt/data/r868_test/createStudioExport.ts` has identical length and FNV1a **`b40d44b7`**, independently calculated from connected GitHub source; raw SHA256 `be5e7148caf2eb2899e2def0d33558205e55bfb10436c45ceb7dbc0d3c7493f5`.
- The helper `/mnt/data/r868_test/helper.ts` is Git-blob **`621ace1e9d8168d49c4ea3e19a3f8c10046a19b8`**, matching connected GitHub; SHA256 `00427787eb84b98996d6022a33e69ac80651a19f15844d78fa1c486c59e65954`.
- Ran Node 22.16.0 + globally installed TypeScript against exact source-transpiled functions and an *in-memory serialized Firestore-like transaction double*. The **first harness run was 9 PASS / 2 FAIL** from passing `idempotencyKey` rather than `key` directly to the helper. Corrected local harness and committed repo test. **Second local run 11/11 PASS**, zero failures/skips; TAP SHA256 `0dabdf476b29ea119fed61ad24a6babe4abe15cb80729df98da23e33e10c8d82`, harness SHA256 `d89d7b52d86ff2d96f4543dcc8eb68afaae5ea8c3d30312f4218e74c6d3f84c9`. Covered same retry, three concurrent identical requests, changed kind/job/assets/project, source deletion, foreign asset, failed-commit retry, member revocation, no raw key/output and actor namespace isolation.
- Strict **isolated** `tsc --noEmit --strict --target es2022` compiled exact function with local declaration stubs: **PASS**; stub SHA256 `3e3b5fac30b8e708fb1a9d14f1dd573be7c9c233b06cee6ae232dbad81d97701`. Not a full Studio/Functions typecheck.
- Connected-GitHub final readback across helper, Store, export contract, public route, repaired smoke test, new regression test, original test discovery: **30/30 static checks PASS**.
- The **checked-in** 13-case R868 regression and all prior original Studio tests have **not run** in a complete repository checkout. Cloning from GitHub using local git failed with DNS `Could not resolve host: github.com`. Original pnpm is unavailable; Firebase native emulators/Next.js full build/deploy not performed.

## Remaining acceptance / known limitations
- Native exact-source Node20/pnpm9.7.0 frozen Studio tests, strict typecheck, Next.js build and Functions build. Run repaired original export smoke and new 13-case test, preserve full logs/hashes.
- Actual disposable Auth+Firestore+Storage+Functions emulator race: identical export POSTs in *different processes*, losing HTTP ACK, changed payload, stale/deleted job/asset/project, role downgrade or deletion fence between transaction read/commit; prove exactly one export record, revoked actor denial, no late object writes. Synthetic serialization does **not** certify Firestore concurrency.
- The required export idempotency header changes the public API. Existing callers need an explicit migration and 400/409 acceptance; no cross-session UI key persistence exists for export clients.
- Older internal calls without key remain non-idempotent. Source order of asset IDs is included in digest: if treating asset order as semantically irrelevant is a product requirement, normalize after an independent review.
- Standalone modern project/brief writes and legacy uid-shaped records remain migration work. User-rights inventory for historical generic `jobs`, `jobRuns`, `deadLetters`, and historical exportJobs is not certified complete.
- R858/R859 server-owned Rules fixes and R860–R868 Studio API patches are unmerged. Jobs #252 privileged post-revocation Storage future-write fence, independently issued signed Privacy C6 and actual private Life Movie protected MP4/SRT→owner-only Replay→deletion/device acceptance remain **HARD OFF**.

**This is an idempotent *draft record*, not media authorization, worker execution, or release GO.**
