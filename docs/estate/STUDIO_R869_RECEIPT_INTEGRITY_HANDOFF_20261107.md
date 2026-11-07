# One UrAi Genesis — Studio R869 receipt-content integrity handoff

**2026-11-07 CST | review only | production HOLD.** New draft engineering [Studio PR #196](https://github.com/LifeLoggerAI/urai-studio/pull/196), head `638e5cbebe98d8af15561a35f142baca14c94d25`, stacked on unmerged R868 [#193](https://github.com/LifeLoggerAI/urai-studio/pull/193) `c70bea0d10accbd9d6722dbef07d0a1a9901a5d3`. Both remain review-only; no other workers' branches overwritten.

## Source-level defect established
An existing deterministic draft job/export receipt was accepted on replay when the stored row retained matching owner/tenant/idempotency digests, but its **actual contents** were modified. Local source-transpiled Node22 synthetic tests reproduced 2 failing export cases (mutated kind, asset list) and 3 failing job cases (mutated kind, fabricated outputAssetIds, changed prompt brief), even though pre-existing cases still passed. Client Firestore Rules for modern Studio drafts deny client writes, so do not extrapolate this synthetic defect to a demonstrated production attack.

## New isolated correction and evidence
- R869 `createStudioJob` replay verifies deterministic job ID, actual kind, explicit requested project reference, expected brief binding, no input/output/export output IDs, and original prompt brief's prompt/exports in addition to R867 actor/digests/role/fences; changes reject `studio_idempotency_conflict`.
- R869 `createStudioExport` replay verifies deterministic export ID, actual project/job ID, kind, ordered asset IDs, tenantScoped, draft/no URL/path/expiry and original actor/digests, **still** rechecking references and current membership within the same Admin transaction.
- The original R867 and R868 checked-in regressions now include five new negative cases. Source blob `apps/studio/lib/studio-runtime-store.ts` `9ea6ccc9dcfe5497d03f52bb47f8407c40ce9d35`; test blobs `studio-draft-idempotency-r867.test.mjs` `3ad95c0a066bacb5ec000b3a3e4922754e64f4d2` and `studio-export-idempotency-r868.test.mjs` `4eb6d0f61a78c283ebcc4f484387c878e9d7600b`.
- Executed corrected exact-function local Node22/TypeScript excerpts against synthetic serialized transaction mocks: **30/30 PASS** after the initial five demonstrated negative failures; strict isolated TS checks for job and export PASS. Connected GitHub readback confirms the committed three source changes and five tests; **no new full-branch native suite** executed. Final local container reset erased TAP files, so no surviving verifiable TAP hash. R869 complete forensic source and blocker report: `docs/estate/STUDIO_R869_RECEIPT_CONTENT_INTEGRITY_REVIEW_20261107.md` in PR #196.

## Gate distinctions — no inflated certification
- The correction validates an **unexecuted draft receipt**. It does not create source-to-output signed media provenance, actual Studio movie render, or positive Privacy C6 consent.
- Full Studio Node20/pnpm9.7.0 clean frozen install, original all-tests/typecheck/Next.js build/Functions build and real Auth+Firestore+Storage+Functions emulator concurrency/role-change/deletion tests still have NOT RUN at combined R869 SHA. GitHub clone has been blocked by DNS in the ephemeral local environment; GitHub connector source read/write does not itself execute CI.
- Combine and independently review original R858/R859 Rules patches plus stacked R860–R869 source safely. Jobs #252 privileged Storage future-write fence, trusted signed positive C6, private MP4/SRT, owner-only Replay, deletion, physical-device release GO remain **HOLD**.

**No real private media, provider spend, production writes, branch merges or IAM modifications. One UrAi Genesis production HOLD.**
