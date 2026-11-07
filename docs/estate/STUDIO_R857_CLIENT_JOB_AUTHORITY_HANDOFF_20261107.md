# One UrAi Genesis R857 — Studio client authority regression handoff (2026-11-07)

**Status: TEST CODE COMMITTED, NATIVE EMULATOR NOT RUN, PRODUCTION HOLD.** This is a documentation-only continuation of the existing Genesis PR #180. New isolated engineering **draft [Studio #181](https://github.com/LifeLoggerAI/urai-studio/pull/181)** targets existing engineering branch #179, without modifying #179, #175, main or the Genesis knowledge branch's runtime code.

## Exact source and new test refs
- Studio movie/transport source: [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179), exact `153d6c35557c66a8b9f8629778ca796b83730464`.
- New R857 test-only branch: `review/chalk-studio-r857-job-admission-emulator-20261107` at `481c6d069ec6fd3f0d16e20e2d89e371282c02d2`.
- Added file: `security-tests/studio-memberships/job-admission-r857.review-emulator.test.mjs`. Original Git blob read back from connected GitHub; inspect exact current blob under #181 before native execution.
- Audit subject refs: `firestore.rules` blob `d6a93015ada0ce00ff71c2a63ebb5e1ef1c679e2`, `storage.rules` `06a4520b596038ffd51c941010684e3c30e79931`, `functions/src/create-job.ts` `de3519fe24f0994c4ee59f4c8bd86b0afcd3f97d`, `functions/src/job-runner.ts` `78e3a54212eb30eb1cc9752a84a5daa91232da13`, original membership suite `ebbe9cbcbc3b8354ed2cbccc74018f2cda0f88ea`.

## Precisely scoped finding
1. A valid `viewer` membership satisfies direct client `/jobs` creation/update and shared `/studios/{studioId}/outputs/**` write rules, whereas the callable job creation path checks privileged StudioUsers role and project ownership. A `viewer` can also satisfy direct `/auditLogs` create with arbitrary actor metadata, under the current rule structure.
2. The fallback scheduler consumes `jobs` from the Admin SDK and uses caller-provided `projectId` and `kind` to write explicitly **fallback-only** files. The async `onJobWrite` trigger does not reject new job creation before admission. This suggests a cross-authorization route, **not a proven production exploit**.
3. The original security tests explicitly retain permissive legacy Studio member output uploads, including viewer writes. Client rules must not be changed without investigating active legacy workflows and an authorized migration.
4. The shared Studio output rule **does not** establish authority over Jobs' canonical private Life Movie Storage path. Keep these as different security surfaces.

## Added reproducible test surface
- Eight original synthetic-only test declarations; `URAI_R857_EXPECTATION=observed` characterizes current permission behavior (including negative nonmember and cross-tenant checks).
- `URAI_R857_EXPECTATION=secure` is the *future denial target* and expected to fail on this unchanged source; it is **not** a current passing security result.
- Native run with clean source checkout, Node22, Java21, approved disposable project: `cd security-tests/studio-memberships && npm ci --ignore-scripts --no-audit --no-fund && node prepare-emulators.mjs && npm exec -- firebase emulators:exec --config firebase.json --project demo-urai-studio-memberships --only firestore,storage "node --test --test-concurrency=1 job-admission-r857.review-emulator.test.mjs"`. Verify `npm exec` resolves installed pinned `firebase-tools` without downloading a substitute. The test file reads original root rules directly; all network endpoints are strict loopback.
- Following a proposed narrowly reviewed fix, require secured mode PASS, existing membership suite full PASS, no legacy breakage, and an Admin fallback process integration test proving no other-owner output creation.

## Execution and evidence limits
This current assistant runtime has Node v22.16.0 and Java21, but **no pnpm, firebase CLI or @firebase/rules-unit-testing installation**. Its container DNS could not resolve `github.com` or `registry.npmjs.org`; native Firebase and full frozen Studio build **not executed in R857**. A local draft of the test passed `node --check`, but that is not the original Firebase runtime or exact GitHub byte test. GitHub readback/commit and PR creation are verifiable. No new paid Runpod pod, deploy, project IAM, source rules, original customer media or positive C6 grant.

## Handoff decision
Treat #181 as an independent **test-only unmerged draft**, not a remedy and not an approved GO. If native current-source emulators reproduce the client permissions, coordinate a server-authoritative jobs queue and immutable trusted state/role rules without silently breaking historic client flows. Continue Jobs #252 storage-enforced future-write fence and audited Privacy C6 grant **before** any real Life Movie, owner Replay, or production release.
