# One UrAi Genesis — Studio R865 current tenant membership gate handoff

**2026-11-07 UTC — review only, production HOLD.** New unmerged [Studio draft PR #189](https://github.com/LifeLoggerAI/urai-studio/pull/189), head `60d908e6d024da201a31a19703c75880b0a7478d`, stacked on R864 [#188](https://github.com/LifeLoggerAI/urai-studio/pull/188) `511ab24e1dfc88e4d8323988fd807b1aa9c66c1d`. No active worker branches, production permissions or real private media were changed.

## Implemented review-only source
- New `apps/studio/lib/studio-member-auth.ts` Git blob `f3e2f2f6c7331106867c28bab0c2bf2988cafef5` requires **current** server-provisioned `studioUsers` role and `memberships/{uid}_{tenant}` identity, role and active status in addition to R864 signed Firebase tenant; denies disabled/revoked/foreign membership, current Studio owner deletion fence and Privacy tombstone including active deletion-planning lease. Distinct read versus draft role policy.
- All three ordinary Studio routes `/api/studio/jobs`, `/api/studio/exports` and `/api/studio/video-factory` use `requireStudioMemberAuth` for GET and POST and `refreshStudioMemberAuth` after parsing before persistence. Existing original authorization test/smoke checks adapted and new `apps/studio/tests/studio-member-auth-r865.test.mjs` added (16 checked-in synthetic test declarations).
- Updated source blobs: Jobs route `84f2870aca6a1ee92ec9b5a000189f48dc00c86e`, exports route `2716ce79dcbeb2b868ccb176fd2ad44b510d7009`, Video Factory route `3bb5a33c555a96e97b9c6b429258e4d0dcde9b85`; original auth-gate regression `a3b1d84ab85519c94bd86c26b59af16f397a55f1`, export smoke `567aff1d72877db142066318f6e5d551dec58cb5`; new regression `8cfde8df51fbf9579c2b552369d9b167f7e1be28`.
- Full detailed evidence and exact acceptance plan are in `docs/estate/STUDIO_R865_CURRENT_MEMBERSHIP_REVIEW_20261107.md` on #189.

## Evidence classification
- Node22/TypeScript5.8.3 actual transpiled helper against a synthetic Admin document backend: **19/19 PASS** with no skipped tests; the 4,494-byte helper Git blob matches connected GitHub, raw SHA256 `32481ed8f25bfe7b8539d0c78d7871d52108e73954d293c32887d4963715df3b`, TAP SHA256 `005b45edce6f36c7993c5e1a9e968f4c447f4deb542a19a5a1dfcb37aba45f58`.
- Local strict isolated TypeScript typecheck with Firebase interface stubs PASS. Connected GitHub source readback 23/23 structural assertions PASS. The checked-in new 16-case test and original full Studio Node20/pnpm9.7.0 suite are **NOT run**, as are native Firebase four-service emulators, CI and production. Never count synthetic runner and source assertions as a positive private rendering certification.

## Still-open P0/P1
1. **Not transaction-atomic with membership:** R865 route rechecks permission before Admin store transaction, but member revocation/deletion may happen between those calls. A real transaction-bound authority check or storage-level generation fence and concurrency tests must close the race. Never claim revoke-after-check security.
2. **Not private movie consent:** These memberships and owner fences are not independently issued signed Privacy C6 grants. Jobs #252 privileged Storage late writes remain OPEN; don't render private Life Movies.
3. **Not worker integration:** Modern `studioJobs` still stores drafts; old Jobs and fallback systems, source-to-render output, protected Replay, media checksums and deletion are not one verified runtime.
4. **Not request idempotency:** Successful commit followed by lost HTTP acknowledgment still creates duplicate drafts; build tenant+actor+body-digest-bound idempotency only with conflict and race acceptance.
5. The previous R858/R859 rules repairs, R860-R865 API changes, legacy `uid` project migration and owner-rights inventory remain unmerged / unverified full build.

**Next:** clean exact #189 frozen app+Functions build; native Auth/Firestore/Storage/Functions tests with owner, viewer, role downgrade, membership revoke during transaction, deletion fence; then production IAM/rules readback and end-to-end positive only after all P0 gates. No billed resources, production writes or private media were used.
