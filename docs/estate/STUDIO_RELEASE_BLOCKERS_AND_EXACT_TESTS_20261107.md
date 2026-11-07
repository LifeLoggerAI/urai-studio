# Studio P0 blockers and exact remaining acceptance tests — 2026-11-07

**RELEASE HOLD.** Preserve main, separate donor PRs, real user media, IAM and billing.

## Blocking security and runtime facts
1. **P0 trusted consent**: Jobs #320 `lifeMovieConsentAuthorityAvailable()` is deliberately `false`. A Studio consent object with `purpose:life-movie.render`, `policyVersion:1.1.0` and 64-char receipt SHA shape cannot be equated with a signed, issuer-verified grant. Demand subject, sourceSet, project, plan, deletion/consent epoch, source rights and current identity verification.
2. **P0 post-revocation GCS write**: [Jobs issue #252](https://github.com/LifeLoggerAI/urai-jobs/issues/252) documents privileged writer ability to create new derivatives after revoke. A preupload Firestore read, process-local state, best-effort cleanup, or post-delete listing is not a storage enforced future-write denial. The Jobs `lifeMovieWriteReservationsReview.ts` explicitly isn't installed in worker and is emulator-review-only. Zero positive private render until actual scoped writer IAM/fence and upload drain.
3. **P0 owner-only Replay/deletion**: No verified full positive render→owner-only playback→withdrawal→all derivative deletion→future-write refusal with physical browser/device. No publicly reusable links.
4. **P1 Studio fallback lease**: #175 five donor paths absent/diverged from #179, including attempt-scoped output and index order. Integrate separately on a review branch only after source-level diff and native emulator tests. Not a substitute for P0.
5. **P1 source fidelity**: Input sources are pinned by SHA and Storage generation as *claims*; verify actual bytes, owner-rights, media duration/offset, human SceneTruth, model/provider versions, output alignment, audio/video timestamp/frame hash, and final artifact original bytes.
6. **P1 build/CI/ops**: No native full candidate suite run *in this audit* because local node v22.16.0, pnpm unavailable and GitHub DNS clone unavailable; original root package requests Node20/pnpm9.7.0. Previous #179 R843 reports a valid external frozen full build, but original stdout wasn't re-downloaded. Hosted GitHub runner #179 zero steps cannot grant protected CI. Provider, deployment, IAM and billing unverified.
7. **P1 history and binary coverage**: Need safe Git full clone/mirror, all 160 branch trees/reachable commit DAG, LFS and archives, raw hashes, historic 160MB tag contents with archive traversal guard, original 32-file video ZIP, Creative Factory/cloud media and exact deployed code provenance.
8. **P2 device/artistic acceptance**: Replay source-to-scene fidelity, genuine MP4 audio/visual QA, 9:16/16:9, caption accessibility, blind/trauma-reduced-motion support, actual supported devices and independent reviewer.

## Ordered no-private-data test commands, on fresh authorized isolated host
First obtain clean exact-source checkout **without overriding another branch**:
- Studio: `git checkout --detach 153d6c35557c66a8b9f8629778ca796b83730464`; Node20, pnpm9.7.0; `corepack pnpm@9.7.0 install --frozen-lockfile`; `corepack pnpm@9.7.0 --filter studio test`; `corepack pnpm@9.7.0 --filter studio typecheck`; `corepack pnpm@9.7.0 --filter studio build`; `corepack pnpm@9.7.0 --dir functions build`; `corepack pnpm@9.7.0 run release:check`. Save exit codes, unredacted *nonprivate* TAP summary, exact source and lockfile SHA, stdout/stderr SHA-256, final cleanliness.
- Jobs: `git checkout --detach ea8f0165ac74511a4e4196919ddd3109d0c1ff2e`; Node22/pnpm8.15.9; `pnpm install --frozen-lockfile`; `pnpm urai-jobs:verify`; `pnpm typecheck`; `pnpm build`; run **original** Jobs private media, write fence and cross-repo bridge native scripts only with disposable Firebase 4-emulator project and native socket and fixed-port preflight.
- Privacy: `git checkout --detach 5daa194148c1f0b157062ca09b8f1b6e629d6d29`, run original current native consent decision/issuer and Auth/Firestore/Storage/Functions integration with Java21 and clear emulator ports. Do not issue a real production consent grant.

## Exact synthetic and native acceptance scenarios (must fail closed)
A. GET `jobs-contract` and POST with proper plan: deterministically equal render-plan/sourceSet digests and explicit `renderConsentAuthorized:false`, `consentGrantIssued:false`. Repeat with changed Storage object `generation`, `ownerOrRightsRef`, scene digest, timeline, ordering, audio offset (45m boundary), malformed/duplicate sources, unbounded body and 32KiB bridge cutoff; verify rejection or changed fingerprints before external transfer.

B. Test Studio→Jobs actual Functions endpoint with service identity and disposable owner/tenant: missing/forged/inherited/accessor consent, wrong purpose/policy/hash/scope, altered owner/source rights, stale/deleted source, revoked owner and deletion fence => denial and **zero Storage writes**; validate 307 credential redirect refusal, response size/timeout, token leak refusal, tenant isolation.

C. Review **real** Privacy C6 positive only after independent issuer implemented, authorized disposable test owner and source rights, signed current actor/service identity and sourceSet digest. Job creates, worker consumes exact pinned input generations, produces owner-only MP4 and SRT, records output checksums and pinned generations, final playback returns no reusable public URL. No use of live customer memories and no bypass boolean.

D. Force interleavings: revoke after preflight before first byte; revoke during multipart upload; revoke after uploaded bytes before generation receipt; revocation after inventory before clearing metadata; repeated revoke; concurrent cancel/delete/resume; different tenant/bucket/service account. Require Storage-level denial or safe drain + known generation deletion **before** ACK; after ACK all stale writers and alternate-bucket identities unable to create new generation.

E. Verify generated film actual media: FFprobe/FFmpeg decode every output, duration/dimensions/fps, source clip in/out and audio sync, caption intervals and shot/SceneTruth fidelity, license/model receipts, full MP4/SRT bytes SHA-256, playlist segment checksums, frame/timeline parity and parent job bindings. Compare to authorized selected source set, not mere endpoint response.

F. Test authenticated owner-only Focus→Replay/return on actual supported browsers/devices, no raw `gs://`/signed URL, permission changes midstream and per chunk, abort revocation, cache/no-store, cross-user denial, screen-reader captions and reduced-motion/trauma-sensitive UI.

G. Require independent non-author reviewer, protected CI all steps executed at fixed merged SHA, deployment parity, Firebase/GCS IAM proof, rollback, cost/consent policy and explicit founder release authorization. Do not merge or deploy from documentation.

**Evidence grading:** exact local unit PASS ≠ four-emulator PASS ≠ integrated positive private movie ≠ device pass ≠ production. All unexecuted scenarios remain OPEN, not implicit failures or successes.
