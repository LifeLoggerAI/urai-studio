# R858 — Studio server-owned Jobs and audit evidence (review-only)

**Date:** 2026-11-07. **Engineering base:** Studio movie candidate #179 exact `153d6c35557c66a8b9f8629778ca796b83730464`. **Production HOLD.** This branch is not an authorized release or cloud Rules deployment.

## Minimal repair in isolated branch

- `firestore.rules`: keep member-scoped reads of `jobs/{id}` and `auditLogs/{id}`, deny all direct client create/update/delete on both. Server-authoritative Firebase Admin callables and job-runner retain ability to operate; their own admission and rights must still be independently verified.
- `security-tests/studio-memberships/membership.test.mjs`: original compatible `jobs` client-write-success assumption is removed from the legacy mutable-collection loop; 7 tests added (3 roles × job create/update/delete, 3 roles × forged audit create, 1 seeded server record read). The original member Storage outputs compatibility tests remain unchanged, pending separate reviewed migration.
- No change to `jobRuns`, `assets`, `outputs`, `deadLetters`, `clipRequests`, Storage rules, active movie routes, Firebase IAM, deployed Firebase project or Privacy C6. Their client-writable metadata paths require separate authority and compatibility audits.

## Historical architectural authority
Original `apps/studio/LOCK.md` Git blob `b6e77801f5268896dba99d76c2910379ef5f9e42` (2026-02-03) explicitly calls `jobs`, `jobCommands`, and `auditLogs` server-owned, and the `apps/studio/src/server/jobCommands.ts` and `jobsStore.ts` use Firebase Admin. Original `functions/src/create-job.ts` blob `de3519fe24f0994c4ee59f4c8bd86b0afcd3f97d` checks Studio role and project ownership. Original Firestore Rules blob `d6a93015ada0ce00ff71c2a63ebb5e1ef1c679e2` instead permitted client Studio viewers to directly create/update Jobs and forge audit records. An async `onJobWrite` trigger is not a synchronous precommit admission gate.

## Verification as performed in this review
- **15/15 source-structure comparisons passed** using read-back connected GitHub bytes of R858 and exact original #179 (no Firebase runtime): denied writes; preserved membership reads; confirmed original was writable; unchanged shared outputs, clip requests, jobRuns and dead letters; updated test intents; preserved prior compatibility.
- R858 Firestore rules Git blob `2503f5607e6ed632d343792462c69164a7e42b59`; R858 membership test Git blob `57f51a244f6604541c5418e2b2664dd17c23e8ae`. Git tree and branch commit must be refreshed before real execution.
- **No native Rules emulator, Node20 frozen app build or Functions build was executed for R858.** The local container has Node22/Java21 and no Firebase CLI, pnpm or npm SDK cache; DNS to npm/GitHub unavailable. These are proposed unmerged changes, NOT an independently runtime-verified repair.

## Next exact native acceptance on approved disposable host

```sh
git checkout --detach <R858_EXACT_REVIEW_COMMIT>
test -z "$(git status --porcelain --untracked-files=all)"
cd security-tests/studio-memberships
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm audit
```

The existing suite exercises real Firestore/Storage mock-auth emulator requests, not string matching. Record full no-secret TAP, exit, source/lock hash, emulator ports, Java21 and Firebase CLI version. All original membership, deletion-fence, and baseline-exploit cases must pass and the seven new negative tests must pass. Separately run original R857 branch's *secure mode* against an exact merged review candidate (its shared-output check was corrected to remain compatible), and test actual Admin callable + fallback worker authorizations with disposable projects. Do not interpret passing Rules tests as an installed IAM fence or private Life Movie authorization.

**Unresolved:** shared outputs/tenant asset integrity, `jobRuns` and `deadLetters` client mutation, historical forged membership migration, Jobs #252 privileged Storage late-write after revocation, signed positive Privacy C6 issuance, authenticated original private movie render→Spatial Replay→deletion, deployed rules parity, independent review and founder GO. Preserve hard-off until these independently pass.
