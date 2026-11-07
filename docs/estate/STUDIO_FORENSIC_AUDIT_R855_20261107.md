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
