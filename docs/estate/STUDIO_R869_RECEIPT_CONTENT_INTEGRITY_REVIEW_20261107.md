# One UrAi Genesis Studio — R869 stored-draft receipt integrity

**2026-11-07 CST. Source-level repair for review only. Production HOLD.** Stacked on R868 [#193](https://github.com/LifeLoggerAI/urai-studio/pull/193), parent commit `c70bea0d10accbd9d6722dbef07d0a1a9901a5d3`; no merges, deployments, private source media, paid providers, or customer data.

## Exact defect reproduced against source
The R867/R868 retry flow previously checked the stored job/export document's tenant, owner, idempotency SHA-256 digests and draft status before reusing an existing receipt. That did **not** verify that the actual stored document continued to express the same source and output meaning as the authorized request. A privileged or corrupted stored row could retain hashes while changing `kind`, export `assetIds`, job `outputAssetIds`, or original brief `prompt`; the replayer returned `replayed:true` despite the mismatch.

This is a source-integrity validation defect, **not evidence of client write access or a production exploit**. The reviewed original Firestore Rules deny direct client writes to `studioJobs`, `studioBriefs` and `studioExports`; Admin/service writers and stored-data corruption remain separate trust boundaries.

Before correction, I exercised exact source-matched functions with local Node22/TypeScript and serial synthetic Firestore transaction fixtures:
- Export replay: **11 previous cases PASS, 2 new integrity cases FAIL** for modified persisted `kind` and modified persisted `assetIds`.
- Job replay: **14 previous cases PASS, 3 new integrity cases FAIL** for modified persisted `kind`, fabricated `outputAssetIds` and changed original prompt brief.
- The failure is meaningful only for these synthetic fixtures; no live Firebase service or private film rendered.

## Minimal R869 repair
- `apps/studio/lib/studio-runtime-store.ts` job replay now verifies deterministic record ID, exact job kind, supplied explicit project, expected brief reference, and empty input/output/requested-export IDs, in addition to existing digest, actor, status, provider/model and project/brief owner checks. A newly supplied prompt brief must still contain the requested original prompt and requested export kinds. Any mismatch returns `studio_idempotency_conflict`, without creating an output.
- Export replay verifies deterministic ID, actual `projectId`, optional `jobId`, export kind, exact *ordered* asset list, `tenantScoped:true`, draft status, absence of output URL/storage path/expiry and existing actor/key/body digests. Existing transaction-bound owner membership, deletion fence and referenced project/job/asset authorization reads remain.
- Appended 3 negative tests to existing `studio-draft-idempotency-r867.test.mjs` and 2 tests to `studio-export-idempotency-r868.test.mjs`. The files now declare **17** and **15** `test()` cases respectively. No new dependencies, API headers, worker execution, signed consent or data migration.

## Execution and verification boundary
- **Before fix**: 5 new integrity cases failed as expected against exact source excerpts on synthetic backends (2 export, 3 job).
- **After local fix, before repository commit**: Node22 execution of the patched exact-function excerpts with the existing 25-case harness plus 5 new negative cases resulted **30/30 PASS**, zero failures/skips; separate strict isolated TypeScript checks on both excerpts and local type stubs **PASS**. These used synthetic serialized Firestore transactions, NOT real Firebase transaction concurrency.
- **Committed, exact GitHub source** after applying the same three source substitutions and appending tests: `apps/studio/lib/studio-runtime-store.ts` Git blob `9ea6ccc9dcfe5497d03f52bb47f8407c40ce9d35` (job excerpt 7,669 characters, FNV1a `bb5d56b1`; export excerpt 5,001 characters, FNV1a `21be883c`); job regression blob `3ad95c0a066bacb5ec000b3a3e4922754e64f4d2`; export regression blob `4eb6d0f61a78c283ebcc4f484387c878e9d7600b`.
- **Important limitation:** the local container later reset, removing earlier local TAP files. The prior 30/30 execution outcome was observed, but no surviving log SHA256 can be independently checked from the reset container. There has **not** been a fresh full checked-in repository test run against the final GitHub branch, full Node20/pnpm frozen build, GitHub CI, four-service Firebase emulator, live media or device test. Do not promote the isolated pass to any of these categories.

## Remaining release gates
1. Clone exact R869 head into a native environment with Node20/pnpm9.7.0, run all original `apps/studio/tests/all.test.mjs`, TypeScript, Next.js and Firebase Functions builds, check no failing legacy assertions. Capture complete TAP/log SHA256.
2. Real disposable Auth/Firestore/Storage/Functions emulators: concurrent same-key POST/transaction retries and key conflicts; alter stored export/job/brief only through a trusted test fixture, then assert no replay success for mismatched actual contents; reject revoked owner/deletion-fenced writes during transaction commit and confirm no persisted objects.
3. Validate preservation of source/provenance for actual rendered outputs separately; this repair only protects **unexecuted draft receipts**, not an independently signed source manifest or real MP4/SRT hashes.
4. Complete independent review/merge of stacked R858–R869 changes and canonical Genesis source. Ensure no worker rewrites source/Rules out from under active peer reviews.
5. Jobs P0 #252 privileged Storage post-revoke future-write protection, positive Privacy C6 consent issuer, real private source→authorized render→owner-only Replay→revocation/deletion and physical-device acceptance remain HARD OFF.

**No production write, private media, IAM change, paid compute or branch merge. Studio Genesis production HOLD.**
