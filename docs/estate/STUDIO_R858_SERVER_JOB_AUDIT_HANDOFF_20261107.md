# One UrAi Genesis — Studio R858 server-owned job/audit review (2026-11-07 UTC)

**Release HOLD; new review-only engineering PR [#182](https://github.com/LifeLoggerAI/urai-studio/pull/182), unmerged.**

## New independently sourced finding
Studio's original 2026-02-03 `apps/studio/LOCK.md` (Git blob `b6e77801f5268896dba99d76c2910379ef5f9e42`) identifies `jobs` and `auditLogs` as **server-owned**, with Firebase Admin job listing/replay. Current Studio movie candidate [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179), commit `153d6c35557c66a8b9f8629778ca796b83730464`, instead authorizes direct Studio viewer client create/update on `jobs/{id}` and direct audit record creation. The server `createJob` callable separately checks role and project ownership; the fallback Admin scheduler reads that writable job queue. This is a source-level trust-boundary mismatch, not production exploitation proof.

## Isolated source repair on draft #182
- Branch `review/chalk-studio-r858-server-job-audit-rules-20261107`, commit `c0df95eaef976c10b4f5b611060f83ac1c4e035a`.
- `firestore.rules` blob `2503f5607e6ed632d343792462c69164a7e42b59`: client create/update/delete for `jobs/{id}` and `auditLogs/{id}` now `false`. Original membership-scoped **reads unchanged**. This does not restrict genuine Firebase Admin operations.
- `security-tests/studio-memberships/membership.test.mjs` blob `57f51a244f6604541c5418e2b2664dd17c23e8ae`: remove obsolete job client update success assumption; add seven new emulator cases requiring role-specific job create/update/delete denial, signed-author-only audit creation, and original Admin-seeded read continuity. Existing legacy shared outputs/Storage tests unchanged.
- Evidence/report file `docs/estate/STUDIO_R858_SERVER_JOB_AUDIT_REPAIR_REVIEW_20261107.md` on #182.
- Separate prior [#181](https://github.com/LifeLoggerAI/urai-studio/pull/181) revised to keep legacy viewer shared-output **compatibility** even in proposed `secure` mode, commit `70deea733d6b408e0b94ca0eb1645784e5783430`. It is *not merged* into #182.

## Verification and authority
Direct connected GitHub source comparison: **15/15 source-structure checks PASS** for 2 denied writes, 2 preserved reads, historical writable source, unchanged legacy output/clipRequests/jobRuns/deadLetters, test expectations and preserved compatibility. These are source comparisons only, NOT actual Rules emulator results, certified compilation or production evidence.

The container has Node22 and Java21 but no Firebase SDK, firebase-tools/pnpm or outbound npm/GitHub DNS. Therefore the original `npm test` Firebase emulator suite, postrepair R857 secure-mode, full frozen Studio/Functions build, deployed parity and privileged IAM tests were **NOT RUN** in R858. This is a plausible, reviewable patch—not a runtime-certified security fix.

## Remaining tests and P0
- In clean exact R858 checkout: `cd security-tests/studio-memberships && npm ci --ignore-scripts --no-audit --no-fund && npm test && npm audit`; retain exact heads, all original/added native cases, source/lockfile SHA256 and redacted logs.
- Rebase/integrate R857 eight-scenario test on exact repaired candidate without changing original worker branch; require secure-mode denial for jobs/audit plus the original owner/creator/viewer legacy shared outputs compatibility success. Confirm actual Admin callable creates authorized job and fallback worker never accepts ownerless/forged/revoked jobs. Independent reviewer must approve any Rules rollout.
- **Still not closed:** permissive `jobRuns`/`deadLetters` and shared metadata/output writes; historical possibly forged memberships; Storage-level privileged writer GCS post-revoke fence [Jobs #252](https://github.com/LifeLoggerAI/urai-jobs/issues/252); current signed positive C6 grant, true authenticated private render→Spatial owner-only Replay→deletion, device verification, deployed parity and founder GO.

**No source PR merged, production Rules updated, tokens accessed, paid pod started or real private media processed. Preserve production HOLD.**
