# One UrAi Genesis — Studio forensic continuation, R855 (2026-11-07)

**Status:** Working application and movie contracts confirmed in source; private authorized Life Movie end-to-end **HOLD / NOT CERTIFIED**. This is a documentation-only forensic continuation of the existing R854 pack and [PR #180](https://github.com/LifeLoggerAI/urai-studio/pull/180). No unreviewed source merge, renderer enablement, private media access, billed resource or deployment.

## Source boundaries
- Studio main: `854477d80b1a7aa718edb60d1ed4c1cf22dbed9d`; engineering movie candidate [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179): `153d6c35557c66a8b9f8629778ca796b83730464`.
- Divergent fallback lease [#175](https://github.com/LifeLoggerAI/urai-studio/pull/175): `aeac000487bb79d3f2e7ea1af406fb96c1a2a1ba`, not represented as admitted to #179.
- Jobs [#320](https://github.com/LifeLoggerAI/urai-jobs/pull/320): `ea8f0165ac74511a4e4196919ddd3109d0c1ff2e`; Privacy [#236](https://github.com/LifeLoggerAI/urai-privacy/pull/236): `5daa194148c1f0b157062ca09b8f1b6e629d6d29`.
- Read the central private Labs [PR #262](https://github.com/LifeLoggerAI/urai-labs-llc/pull/262) for the cross-system evidence protocol. This public Studio knowledge pack contains only safe source metadata already public.

## Deliverables committed on this same documentation branch
1. [Categorized exact-head file and asset manifest](STUDIO_FILE_ASSET_INVENTORY_20261107.json): 908 file paths, 6,068,047 Git-reported bytes, size and blob SHA for every path; explicitly zero claimed all-raw-byte SHA-256 coverage.
2. [Completion matrix](STUDIO_COMPLETION_MATRIX_20261107.md): implementation versus independent test versus release blockers.
3. [Source-to-output provenance graph](STUDIO_SOURCE_TO_OUTPUT_PROVENANCE_20261107.md): original media→SceneTruth→immutable source selection→hashes→Jobs→output→Replay→revocation.
4. [Rendering acceptance ledger](STUDIO_RENDERING_ACCEPTANCE_LEDGER_20261107.md): observed original code, prior worker reports, source-specific results, current unavailable host, negative paths and non-transferrable claims.
5. [Worker and dependency lineage](STUDIO_WORKER_DEPENDENCY_HISTORY_20261107.md): #159→#177→#178→#179, divergent #175, peer repo SHAs and open edges.
6. [P0 blockers and exact ordered tests](STUDIO_RELEASE_BLOCKERS_AND_EXACT_TESTS_20261107.md): current unverified safety properties, reproducibility commands, disposable-data tests and independent GO conditions.

## New direct source observations
- `/api/studio/video-factory/render` returns a JSON planned render package from `buildVideoFactoryRenderPackage`. It does **not** itself encode an MP4. Public diagnostic capture/FFmpeg workflows exist separately.
- `/api/studio/video-factory/jobs-contract` returns a bounded Jobs envelope, `renderPlanDigest`, `sourceSetDigest`, and explicit `renderConsentAuthorized:false` and `consentGrantIssued:false`; it never dispatches a job.
- Studio `jobs-dispatch` reauthenticates before/after server-to-server Jobs HTTP. A well-shaped 1.1.0 consent reference is no grant. Jobs `lifeMovieConsentAuthorityAvailable():false` explicitly denies positive private creation.
- Jobs [P0 issue #252](https://github.com/LifeLoggerAI/urai-jobs/issues/252) remains open: privileged Storage writer bypass post-revocation; review-only Firestore write reservation prototype is not installed as production storage authority.
- `studio-spatial-private-playback.ts` validates playlist/content binding and reauthorization in source, but no authentic private movie rendered and played on supported devices was independently verified.

## Coverage and audit honesty
- The existing R854 pack already enumerates 160 branches and selected main/#179/#175/tag inventories. This continuation generated its own exact #179 tree ledger from a complete nontruncated Git API response; did not independently download every blob or historical archive, traverse every commit, inspect physical output, run original cloud emulators or reconstruct all 2024–2026 predecessors.
- Current local host: Node 22.16.0; no pnpm; GitHub DNS clone unavailable. Full native Studio Node20/pnpm9.7.0 build/test **NOT RUN in this R855 continuation**. Prior reported Runpod #179 R843 16/16 native stages and diagnostic P0 observation are not claimed as freshly rerun here. GitHub Actions #179 zero-step failures also cannot be represented as passing code tests.
- Git Blob SHA and size are Git metadata; only actually fetched selected text files are source-read. No raw SHA256 materialization of the whole tree or binary archives in this pass.
- Do not reopen false consent authority, allow unreviewed privileged Storage write, promote isolated synth tests to positive render certification, or mark production GO.

**Next real gate:** keep C6 hard-off while Jobs owner/Privacy team implement auditable, storage-enforced post-revoke future-write denial and production-grade signed owner/source-set consent. Then accept disposable-owner real Studio→Privacy→Jobs→Storage→Spatial output/revoke/deletion and physical Replay on pinned exact heads, with independent reviewer and founder authorization.


## R856 — additional independent source, runtime and asset review (2026-11-07 UTC)

- [Executed exact-blob fallback lease regression](STUDIO_R856_LEASE_EXECUTABLE_RECEIPT_20261107.md): actual reconstructed original TypeScript exports from #179 and divergent #175 match their Git object hashes; **10/10 local supplemental Node tests PASS**. #179 considers expired/missing-expiry leases owned if runner+attempt match; #175 rejects. Original full Studio/Firestore/GCS tests were not run in this continuation.
- [Client SDK/Functions authorization gap](STUDIO_R856_JOB_PERMISSION_BOUNDARY_20261107.md): candidate Firestore `/jobs` allows any owner/creator/viewer membership to create/update; the corresponding callable requires privileged role+project ownership; the Admin fallback scheduler reads the same client-writable queue. Storage `studios/{studioId}/outputs/**` likewise allows member viewer writes, **confirmed as intentional legacy compatibility in the checked-in membership emulator test**. This is **source-level authority-boundary concern**, not proof a live tenant was compromised or that canonical Jobs private Life Movie Storage is exposed. Require synthetic-owner emulator reproducer before any coordinated nonbreaking rules migration.
- [Media, provider, deployment and build gaps](STUDIO_R856_PROVIDER_MEDIA_BUILD_GAPS_20261107.md): separate render JSON/MP4 placeholder/real diagnostic FFmpeg pipelines; generic world specifications do not contain finished geometry, exact capture bindings remain BLOCKED, `.firebaserc` is declared configuration not production Firebase proof. Connected Vercel scope has no matching Studio project; cloud/provider production parity remains unverified.
- [Reclassified exact-source Git tree manifest](STUDIO_FILE_ASSET_INVENTORY_20261107.json): 908 Git blob paths unchanged, 6,068,047 bytes unchanged; now distinguishes 4 tracked TGZ, 3 ICO and 15 SVG path occurrences. No raw archive, historical movie ZIP, provider storage or 160-tree full-content audit completed.
- **Preserve existing P0 Jobs #252 and positive C6 hard-off**. These new findings are additional release review gates, not a basis to bypass the actual movie authorization boundary or modify live privileges.

The R856 source and test documentation was written only to this existing R854/R855 draft documentation branch. No other worker branch, Firebase Rules, execution code, cloud project, paid provider, protected production deployment, or private owner media was changed.


## R857 — isolated native Rules reproducer for Studio client job authority (2026-11-07)

- New **test-only** engineering [Studio #181](https://github.com/LifeLoggerAI/urai-studio/pull/181) bases directly on #179 exact `153d6c35557c66a8b9f8629778ca796b83730464`, adds eight proposed disposable Auth-context Firestore/Storage Rules tests at commit `481c6d069ec6fd3f0d16e20e2d89e371282c02d2`. Neither #179 nor #175, main or production was edited.
- [Full R857 test execution handoff](STUDIO_R857_CLIENT_JOB_AUTHORITY_HANDOFF_20261107.md): source-level job/viewer/audit/output permission mismatch and exact original Git blobs; *observed* mode characterizes permissive current-source behavior; *secure* mode is prospective denial and **NOT a passing result** on this source. The new test file was committed and GitHub-read-back, not executed with actual Firebase.
- **R857 native execution blocker**: local Node22/Java21 present, but Firebase CLI and SDK absent, and npm/GitHub DNS unavailable; no new full Studio build, real emulator, source-fixed admission, privileged storage fence or positive C6 receipt. Local `node --check` passed for a corresponding precommit test draft only; do not promote to native test success.
- Separate strict source boundary: the legacy `studios/{studioId}/outputs/**` client member write policy is not Jobs' canonical private Life Movie Storage prefix. Native security review must distinguish these and preserve legitimate client migration pathways.

**Release remains HOLD.** Next safe actions are native two-emulator R857 reproduction at #181 then a separate independently reviewed minimal rules/queue repair and full compatibility gates, alongside Jobs #252 and positive Privacy C6 work.


## R858 — server-owned job and audit admission repair (2026-11-07 UTC)

- [Review-only isolated engineering PR #182](https://github.com/LifeLoggerAI/urai-studio/pull/182) restores the original 2026-02-03 Studio server-owned `jobs` and `auditLogs` trust boundary while preserving tenant-member reads and existing legacy shared output Storage behavior. R858 source commit `c0df95eaef976c10b4f5b611060f83ac1c4e035a`. No merge or deploy.
- [Full R858 evidence and next native acceptance](STUDIO_R858_SERVER_JOB_AUDIT_HANDOFF_20261107.md) records original architecture, exact Git blobs, an updated original membership emulator suite with 7 new negative/read cases, and **15/15 direct source-structure checks PASS**. **This is NOT Firebase emulator or authorized private movie PASS**.
- [R857 diagnostic PR #181](https://github.com/LifeLoggerAI/urai-studio/pull/181) remains independent; its `secure` target was corrected to preserve intentionally legacy viewer shared-output writes, not misrepresent a broad, incompatible output migration. Commit `70deea733d6b408e0b94ca0eb1645784e5783430`.
- Native `npm ci && npm test && npm audit` and full source build remain unrun locally: no SDK/CLI installed, no outbound npm/GitHub DNS. Require independent exact source native verification and compatibility before any approval.
- Still OPEN: `jobRuns`, `deadLetters`, shared output metadata write authority; historical forged memberships; Jobs #252 privileged Storage future-write denial; trusted C6 issuer, real protected MP4/SRT generation, device Replay, deletion and production GO.

**Genesis production HOLD stays in force.**


## R859 — worker attempt/DLQ evidence + split Studio job architectures (2026-11-07 UTC)

- Draft stacked engineering [Studio #183](https://github.com/LifeLoggerAI/urai-studio/pull/183), head `c0f21ff57ad2f6b3525f1f756df6ae7126c4dfc4`, restricts direct client writes to `jobRuns` and `deadLetters` while retaining member reads. Its test suite adds 7 role-based denial/read cases; **15/15 source-structure checks**, **NO native emulator**. It is stacked on unmerged R858 #182 and does not alter real private media.
- [R859 source-wiring and dependency ledger](STUDIO_R859_RUNS_DLQ_JOB_WIRING_HANDOFF_20261107.md) records **23/23 source assertions** showing the different Next.js `studioJobs` state model, Functions `jobs` worker state model and unexported legacy finalization job shape. Checks are static source assertions, not production bridge.
- Data-rights implementation indexes `studioJobs` but omits generic `jobs`, `jobRuns` and `deadLetters` from its enumerated owner collections; actual owner rights/export/deletion need native reconciliation. The Functions `createJob` record lacks `studioId` while client Firestore membership readers require it, a separate compatibility bug to test rather than silently changing old records.
- Jobs #252 post-revocation Storage-level fence and Privacy C6 positive consent remain HARD OFF. True private Life Movie→protected Replay→revocation/deletion and physical device acceptance are still unverified. **Release HOLD.**


## R860 — truthful contract-only draft receipts and genuine worker gap (2026-11-07 UTC)

- New isolated [Studio draft PR #184](https://github.com/LifeLoggerAI/urai-studio/pull/184), head `085573ca9ac36cc594a3b0bf267aff5255c43e3c`, built from source #179, changes Studio generation/export *new records* from misleading `queued` to `draft` and adds explicit no-worker/no-render/no-consent JSON receipts. Replay Teaser UI checks that receipt before claiming a saved draft.
- [Full source-integrity and remaining acceptance ledger](STUDIO_R860_CONTRACT_DRAFT_HANDOFF_20261107.md) documents the historical unbuilt dummy `studioJobs` worker, current configured `functions/src/index.ts` output, separated Jobs Life Movie authority and 15/15 connected-source consistency assertions (**not native test execution**).
- New standard Studio test file on #184 is auto-discovered by `apps/studio/tests/all.test.mjs`. Node20/pnpm9.7.0 native full app/Functions build, actual authenticated emulator job persistence and private-media acceptance remain **not run in this pass**.
- Additional pending integration risks: API compatibility for legacy queued records; `createStudioJob`'s non-atomic job-then-prompt-brief writes; three separate job collections; separate owner-deletion inventory. R858 #182 and R859 #183 security reviews remain unmerged.
- Hard-off private film consent and Jobs #252 storage-enforced post-revoke future-write fence remain unresolved. Nothing merged, deployed or activated. **Release HOLD.**


## R861 — actual Node-executed atomic draft/brief acceptance (2026-11-07 UTC)

- New isolated stacked [Studio draft PR #185](https://github.com/LifeLoggerAI/urai-studio/pull/185), head `2db179f0c69943d032bc94a871ad974e82f5d44a`, based on R860 #184, changes newly saved contract-only job and prompt brief writes to **one Admin batch.commit** rather than two independent writes. The job now references the actual generated brief. No private-media or worker enablement.
- [Detailed source-pinned R861 Genesis handoff](STUDIO_R861_ATOMIC_DRAFT_HANDOFF_20261107.md): exact extracted function compared against GitHub blob, Node22+TypeScript **6/6 synthetic atomic Admin tests PASS** and a **strict local stubbed TypeScript check PASS**, with reproducible TAP/SHA256 receipts. The original full Studio workspace, Firebase native emulator, cloud IAM and deploy tests were not run.
- Important open issues: exact owner/project and inherited brief authorization, post-commit response-loss retry idempotency, compatibility of old queued records, old job collection data rights, independent R858/R859 security changes, Jobs #252 privileged Storage fence, positive C6, protected rendering/replay/deletion. **One UrAi production HOLD remains.**


## R862 — owner-scoped Firestore transactional draft admission (2026-11-07)

- New isolated draft [Studio #186](https://github.com/LifeLoggerAI/urai-studio/pull/186), head `eadab9fc521520496702d451f9cdc60db92d49d0`, stacked on R861 #185, checks exact actor tenant+user ownership of existing project/brief references within the **same** Firestore transaction creating the still non-rendered Studio draft. Missing project ID generates a real owned project in that transaction. Review-only: no deploy or merge.
- [R862 Genesis evidence handoff](STUDIO_R862_OWNER_BOUND_DRAFT_HANDOFF_20261107.md) records exact source/test Git blobs and **17/17 connected source assertions**. Revised Node synthetic regression tests are committed but **NOT run** in this turn; prior R861 6/6 does not transfer.
- Remaining separate risks: `createStudioProject` caller-ID upsert without owner check, standalone brief/export owner admission, retry idempotency, existing legacy records, R858/R859 source convergence, native full-build/auth emulator and Jobs #252/Privacy C6 private-render safety. No genuine protected MP4/SRT/Replay/deletion proof. **Release HOLD.**


## R863 — modern project, brief and export owner-bound admission (2026-11-07 UTC)

- New isolated stacked [Studio #187](https://github.com/LifeLoggerAI/urai-studio/pull/187), head `d7081d58a14ff71dfdbd4f3d811f2abe49946573`, guards create-only projects against caller-selected ID collisions and validates project/brief/export tenant/owner/asset/job provenance in Firestore transactions. The proposed changes do **not** enable rendering or change production.
- [Detailed R863 Genesis handoff](STUDIO_R863_OWNER_SAFE_PROJECT_EXPORT_HANDOFF_20261107.md): modern `StudioProject` expects `tenantId`/`userId`, whereas historical `functions/src/studio-system.ts` produces `uid`-centric projects; require an explicit owner-proven schema migration. API tenant fallback from caller header when token lacks tenant claim is an additional unverified trust boundary.
- GitHub source review **24/24 static invariants PASS**; new 13-case synthetic transaction test exists but **has not run**. No full frozen Node20/pnpm build, Firebase emulators, cloud IAM, paid compute or private media runtime.
- Continued blockers: post-response-loss retry idempotency, historical project/owner rights, standalone export source lineage, unmerged R858/R859 Rules changes, Jobs #252 privileged Storage future-write fence, signed C6 and genuine protected private Life Movie→owner-only Replay→deletion. **Production HOLD.**


## R864 — signed tenant claims and per-owner Studio job listing (2026-11-07 UTC)

- New isolated [draft engineering PR #188](https://github.com/LifeLoggerAI/urai-studio/pull/188), head `511ab24e1dfc88e4d8323988fd807b1aa9c66c1d`, stacked on R863 #187. Production/header-supplied tenant fallback when the bearer lacked signed tenant claims removed; `verifyIdToken(token,true)` checks revocation. Local no-token development fallback remains isolated.
- `studioJobs` list is now scoped to both signed `tenantId` and `userId`, with a corresponding index; shared tenant's other users' drafts are not returned by this query. Index and deployed behavior not yet emulator-certified.
- [Exact R864 Genesis handoff](STUDIO_R864_TENANT_OWNER_JOB_LIST_HANDOFF_20261107.md): **9/9 executed local Node synthetic Firebase Auth checks** on Git-blob-matched TypeScript, **12/12 GitHub source assertions**, 11-case checked-in repository regression **not full-suite executed**. Real Firebase membership/index/emulators and frozen Studio build remain OPEN.
- Trusted current membership and role still require separate checks; signed tenant claim alone is insufficient for private Life Movie. Retry idempotency, legacy `uid` migration, R858/R859 source convergence, Jobs #252 post-revocation Storage fence, positive signed C6 and real private render→Replay→deletion remain **HOLD**.


## R865 — current membership, owner role and deletion-fence gate (2026-11-07 UTC)

- New isolated [draft Studio engineering PR #189](https://github.com/LifeLoggerAI/urai-studio/pull/189), head `60d908e6d024da201a31a19703c75880b0a7478d`, based on R864 #188. Before ordinary Jobs, Exports and Video Factory contract-only draft operations, it verifies current server-owned Studio user and exact tenant membership, proper read/write roles, revoked/disabled flags, owner deletion fence and canonical Privacy deletion tombstone. GET and POST are distinguished, with recheck before persisted POST. Local nonproduction no-Admin demonstration remains separate.
- [R865 exact-source and acceptance handoff](STUDIO_R865_CURRENT_MEMBERSHIP_HANDOFF_20261107.md): 19/19 real local Node tests against synthetic Firebase Admin records on verified same Git blob, isolated stubbed strict TypeScript PASS, 23/23 connected source assertions. New 16-case repository test committed but **full original Node20/pnpm9.7.0 suite and Firebase native emulators NOT run**.
- Critical remaining race: prewrite membership recheck is **not atomic with persistence**. Revocation can occur between authorization and the Admin transaction. Full owner-safe processing requires transaction-bound authority or enforceable write fences, actual race tests, fresh permission enforcement throughout private delivery.
- Jobs #252 privileged Storage future-write protection, independently signed positive Privacy C6, genuine protected private movie creation, owner-only Replay and full deletion are not certified. R858/R859, R860-R865 engineering PRs all remain draft/unmerged. **Production HOLD.**


## R866 — transaction-bound member/owner deletion authority (2026-11-07 UTC)

- New isolated stacked [Studio draft PR #190](https://github.com/LifeLoggerAI/urai-studio/pull/190), head `4ded87bb37916924018afc086f49ea59b35c14fa`, based on R865 #189. A shared membership, role, hashed Studio owner-fence and Privacy deletion-tombstone policy is checked through **four Firestore transaction reads**, *inside* all three modern draft writes (job, brief and export), rather than only in a route preflight.
- [R866 Genesis source/test handoff](STUDIO_R866_TRANSACTION_AUTHORITY_HANDOFF_20261107.md): actual transpiled TypeScript helper under Node22 against synthetic transaction **15/15 PASS**; strict isolated typecheck PASS; connected GitHub source-structure **19/19 PASS**. The nine-case checked-in R866 repository regression, actual Firestore transaction-conflict/revoke race, full frozen app/Functions build and production remain **NOT RUN**.
- A synthetic read set does **not** prove Firestore's real retry/commit rejection during simultaneous membership revocation or fence creation. Require disposable authenticated concurrent emulators and zero persisted draft objects. Standalone project create, GET race and lost-ACK idempotency remain open. No private media or paid compute. Jobs #252 post-revocation Storage privilege and signed Privacy C6 still **HARD OFF**, release HOLD.


## R867 — deterministic owner-scoped draft retries (2026-11-07 UTC)

- New stacked [Studio draft PR #191](https://github.com/LifeLoggerAI/urai-studio/pull/191), head `ca62b5a5b9a714cba34f8b9a8b513770c22a967c`, based on R866 #190. Uses an owner+tenant+idempotency-key derived stable `studioJobs` document, body digest and same Firestore transaction read: exact retries return the original `draft` (no new project/brief/job), conflicts return 409, absent/invalid key on Jobs/Video Factory POST returns 400. Replay Teaser retains key across timeout. No worker/consent/render enabled.
- [Full R867 source-pinned handoff](STUDIO_R867_DRAFT_IDEMPOTENCY_HANDOFF_20261107.md): actual transpiled exact helper **14/14 local Node tests PASS**; exact GitHub function-extract matched and executed against synthetic serialized Firestore transaction **14/14 PASS**, strict isolated TypeScript PASS, connected source invariants **25/25 PASS**. Checked-in new 14-case regression is committed but full original suite and real Firebase concurrent transaction/CI/production were **not run**.
- Still open: mandatory key header API compatibility, cross-session retries, standalone export/brief/project idempotency, real Firebase concurrent revoke and lost-ACK tests, R858/R859 Rules merge review, Jobs #252 Storage-level late-write prevention, positive signed C6 and owner-only private Life Movie→Replay→deletion. **Production HOLD.**


## R868 — export draft idempotency plus repaired native export smoke (2026-11-07 UTC)

- New isolated stacked [Studio draft PR #193](https://github.com/LifeLoggerAI/urai-studio/pull/193), head `c70bea0d10accbd9d6722dbef07d0a1a9901a5d3`, based on R867 #191. Applies actor+tenant+request-bound deterministic export IDs and replay receipts to **`studioExports`** inside the existing authority/owner-checked Firestore transaction. Public export POST now requires idempotency key (400) and returns changed-input conflict (409). No media outputs or private grant enabled.
- Original `studio-export-route-smoke.test.mjs` had malformed nested quotes plus obsolete POST-auth expectation; both repaired before native suite execution. New 13-case export regression file committed, but **not run in a full repository checkout**.
- [R868 Genesis handoff](STUDIO_R868_EXPORT_RETRY_HANDOFF_20261107.md): exact GitHub function/blob matched local, **11/11 executed local synthetic Node22 tests PASS after first 9/11 harness error corrected**, strict isolated typecheck PASS, 30/30 GitHub source assertions PASS. No full frozen Node20/pnpm build, actual Firestore concurrent transaction or private-media runtime.
- Remaining: public header compatibility, native Firestore same-key/changed-input/deletion/revocation acceptance, all R858–R868 unmerged, Jobs #252 Storage future-write fence, positive signed C6, authenticated private MP4/SRT→owner-only Replay→deletion and device acceptance. **Production HOLD.**


## R869 — stored draft receipt-content integrity repair (2026-11-07 CST)

- New isolated stacked [Studio draft PR #196](https://github.com/LifeLoggerAI/urai-studio/pull/196), head `638e5cbebe98d8af15561a35f142baca14c94d25`, based on R868 #193. Matching original idempotency hashes could allow a replay receipt to be returned for a **stored draft with changed actual contents** (job/export kind, asset/output references or prompt brief). Five local synthetic negative checks reproduced this before repair; not evidence of direct client tampering or production compromise.
- Proposed checks now require the stored job/export/linked brief content to match original authorized request semantics before returning `replayed:true`, while preserving current actor membership, deletion fences and source ownership. No worker execution or private-media admission. [Exact R869 Genesis handoff](STUDIO_R869_RECEIPT_INTEGRITY_HANDOFF_20261107.md).
- **30/30 local exact-function synthetic Node tests PASS after repair**, isolated strict TS check PASS on job and export; three source changes and five negative tests verified in GitHub blobs. The local container subsequently reset, losing TAP files, so no surviving TAP SHA256; no new full checked-in branch suite, frozen Node20/pnpm build, native Firebase Auth/Firestore/Storage/Functions emulators, CI or production run. Keep those gates OPEN.
- R858/R859 and stacked R860–R869 are review-only/unmerged. Jobs #252 privileged Storage future-write fence, signed positive Privacy C6, real protected MP4/SRT→owner-only Replay→revocation/deletion and physical-device GO remain **HARD HOLD**.


## R870 — actual GitHub Actions failure triage and fail-closed native gate (2026-11-07)

- Rechecked candidate [Studio #196](https://github.com/LifeLoggerAI/urai-studio/pull/196) head `638e5cbebe98d8af15561a35f142baca14c94d25`, unmerged. GitHub returned **three failed workflow runs** (authenticated data-rights emulator `42422397884`, Video Factory `42422398093`, Production Verify `42422397924`). Each had one failed job, **zero accessible job steps and 404 BlobNotFound logs**; failures ended within seconds. These failures are real GitHub statuses, **not proven original test/build/emulator failures**.
- Full R869 Git tree metadata: **1,229 entries / 928 Git blobs / 6,213,608 reported blob bytes**, not complete-byte/history read certification. All **91** `apps/studio/tests/*.test.mjs` files fetched and screened using a JavaScript parser after normalization of ESM import/metadata syntax: **91/91 screening-only syntax PASS**. Their assertions, imports, runtime and full build **were not executed**.
- Local runtime Node22, no pnpm, no Node20 and network/DNS prevents cloning; full frozen install/build impossible here. Added [R870 native acceptance script](STUDIO_R870_NATIVE_ACCEPTANCE.sh) for exact R869 SHA, Node20/pnpm9.7.0, frozen Studio suite/typecheck/lint/build and Functions build, hashed evidence, no cloud credentials and unconditional production HOLD. Bash syntax PASS; fail-closed missing-pnpm and wrong-SHA synthetic preflight EXIT 77.
- [R870 detailed CI/test evidence](STUDIO_R870_NATIVE_CI_TRIAGE_20261107.md) holds original workflow IDs, job IDs, source hashes and next exact steps. No billing, production writes, private media, emulator, CI rerun or merge performed; Jobs #252 Storage privileged late-write fence, signed Privacy C6, real protected private Life Movie/Replay/deletion/device remain **HARD HOLD**.


## R871 — GitHub Actions runner admission and no-charge native acceptance (2026-11-07 CST)

- Genesis source commit `d8dc95abe096de28d93306ac98b810c4369cb956` has **four** failed hosted workflow jobs (Studio CI, Health Guard, Audit, Production Verify), each with `steps=[]`, empty runner name and duration ~2 seconds. These join three previous failed R869-source workflows. They are **runner admission failures/zero execution steps**, not demonstrated Studio compilation or test failures.
- GitHub's October 18 billing email confirms account metered-usage restriction and a historical original Actions annotation from Asset Factory run `41792607935` (job `126449246409`) explicitly identified billing lock as its job-not-started reason. That evidence was already sent in existing Support case **#4889576**. Specific Studio annotations inaccessible, so cross-repo identical cause remains a strong hypothesis, not directly certified. No support reply confirming a zero-charge fix yet.
- [Exact R871 evidence ledger](STUDIO_R871_ACTIONS_RUNNER_ADMISSION_20261107.md) records run/job IDs and source refs. Reconstructed existing [R870 native acceptance runner](STUDIO_R870_NATIVE_ACCEPTANCE.sh) and verified **3,640 bytes**, Git blob `88732f9b26b2094a3136796b88a3655f20f3cb9c`, SHA256 `622faa837cfc0e6d4ce74063b114d615c7cfc21f39748f74f4575237e1e91524`; actual Bash syntax PASS, missing pnpm fail-closed exit 77. No Node20 checkout, frozen build, real emulator, private media or production run.
- Preserve billing/2FA/visibility/branch rules untouched. Next: GitHub owner/support zero-charge runner eligibility resolution, clean source-pinned native execution, independent R858–R869 integration, real Firebase race testing, Jobs #252 and signed Privacy C6 before release. **Production HOLD.**
