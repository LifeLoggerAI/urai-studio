# ONE URAI GENESIS — STUDIO R872 NEXT-CHALK COMPLETE HANDOFF
**As of 2026-11-07 CST / 2026-11-08 UTC. OWNER-PRESERVED; REVIEW-ONLY; PRODUCTION HOLD.**

> **START HERE IN A NEW CONVERSATION.** Read this whole file and the linked knowledge pack before making changes. This is a navigation and evidence-preservation handoff, not a representation that every historical raw file was independently read or that private rendering passed. LifeLogger, LifeOS and UrAi were built systems; this audit is reconciling their real implementations and release gates.

## 0. Canonical locations and source authority
- Consumer product **UrAi**; professional/B2B **RuAi**. Canonical experiential journey: Home → Ascent → Life Map → Focus → Replay → Escape → Focus → Life Map → Home. Studio's job is source-preserving, authorized memory-to-Life-Movie generation, not a disconnected mock button.
- Public Studio repo: `LifeLoggerAI/urai-studio`.
- **Central Studio knowledge branch:** `docs/genesis-estate-handoff-20261106`, [draft PR #180](https://github.com/LifeLoggerAI/urai-studio/pull/180). The very latest branch head must be reread before writing; this file is added after the prior confirmed head `8d9ef0062d37a23003ad7c8a97813539316979e3`.
- **Latest stacked engineering source candidate:** [draft PR #196](https://github.com/LifeLoggerAI/urai-studio/pull/196), branch `review/chalk-studio-r869-receipt-integrity-20261107`, head **`638e5cbebe98d8af15561a35f142baca14c94d25`**. It is **not merged**, not production and not independently certified.
- Original Life Movie/transport engineering ancestor: [draft PR #179](https://github.com/LifeLoggerAI/urai-studio/pull/179), `153d6c35557c66a8b9f8629778ca796b83730464`. Main baseline previously documented `854477d80b1a7aa718edb60d1ed4c1cf22dbed9d`; reverify main before comparing.
- Divergent fallback scheduler/lease donor: [draft PR #175](https://github.com/LifeLoggerAI/urai-studio/pull/175), `aeac000487bb79d3f2e7ea1af406fb96c1a2a1ba`; **not silently contained in #179**. Read `10_FALLBACK_LEASE_DONOR_RECONCILIATION.md`.
- Private cross-repo Labs master estate registry: `LifeLoggerAI/urai-labs-llc`, `docs/estate/00_START_HERE.md`, branch `docs/genesis-estate-registry-20261106`, [draft PR #262](https://github.com/LifeLoggerAI/urai-labs-llc/pull/262), head **`cae6220332f3789ce2768ad7f968e8885fe5956c`** at last read. **Do not copy private Labs content into this public Studio repo.**

## 1. Read these durable files before modifying source
In this same `docs/estate/` folder on Genesis #180:
1. `00_START_HERE.md` and `STUDIO_FORENSIC_AUDIT_R855_20261107.md` (continuously appended through R871).
2. `STUDIO_COMPLETION_MATRIX_20261107.md`, `STUDIO_FILE_ASSET_INVENTORY_20261107.json`, `STUDIO_RELEASE_BLOCKERS_AND_EXACT_TESTS_20261107.md`.
3. `STUDIO_SOURCE_TO_OUTPUT_PROVENANCE_20261107.md`, `STUDIO_RENDERING_ACCEPTANCE_LEDGER_20261107.md`, `STUDIO_WORKER_DEPENDENCY_HISTORY_20261107.md`.
4. `MANIFEST_SELECTED_TREES.json`, `BRANCH_REFS_20261107.json`, `BRANCH_COMPARISONS_20261107.json`, plus `01_COMPLETE_INVENTORY.md` through `10_FALLBACK_LEASE_DONOR_RECONCILIATION.md`.
5. R856–R869 individual handoffs and their engineering PR source reports; particularly `STUDIO_R869_RECEIPT_INTEGRITY_HANDOFF_20261107.md`.
6. `STUDIO_R870_NATIVE_CI_TRIAGE_20261107.md`, `STUDIO_R870_NATIVE_ACCEPTANCE.sh`, and `STUDIO_R871_ACTIONS_RUNNER_ADMISSION_20261107.md`. They distinguish failed runner admission from actual code-test failures.
All documents are evidence with scope limitations; do not treat documentation itself as a native PASS or merge authority.

## 2. Exact open draft engineering stack — reread before reuse
| Work | PR | Head SHA at checkpoint | Base / important note |
| --- | --- | --- | --- |
| Original Life Movie transport | [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179) | `153d6c35557c66a8b9f8629778ca796b83730464` | Ancestor, itself unmerged |
| R858 server-owned job/audit Rules | [#182](https://github.com/LifeLoggerAI/urai-studio/pull/182) | `c0df95eaef976c10b4f5b611060f83ac1c4e035a` | Separate branch **from #179**, do not assume in R869 |
| R859 jobRuns/deadLetters Rules and wiring | [#183](https://github.com/LifeLoggerAI/urai-studio/pull/183) | `c0f21ff57ad2f6b3525f1f756df6ae7126c4dfc4` | Stacked on #182, **not included** in later R860→R869 chain |
| R860 truthful contract-only receipts | [#184](https://github.com/LifeLoggerAI/urai-studio/pull/184) | `085573ca9ac36cc594a3b0bf267aff5255c43e3c` | Separate chain from #179 |
| R861 atomic draft/job/brief persistence | [#185](https://github.com/LifeLoggerAI/urai-studio/pull/185) | `2db179f0c69943d032bc94a871ad974e82f5d44a` | On #184 |
| R862 project/brief owner admission | [#186](https://github.com/LifeLoggerAI/urai-studio/pull/186) | `eadab9fc521520496702d451f9cdc60db92d49d0` | On #185 |
| R863 project overwrite and export-reference owner safety | [#187](https://github.com/LifeLoggerAI/urai-studio/pull/187) | `d7081d58a14ff71dfdbd4f3d811f2abe49946573` | On #186 |
| R864 signed tenant and owner-scoped job list | [#188](https://github.com/LifeLoggerAI/urai-studio/pull/188) | `511ab24e1dfc88e4d8323988fd807b1aa9c66c1d` | On #187; composite index required |
| R865 active tenant membership, role, deletion preflight | [#189](https://github.com/LifeLoggerAI/urai-studio/pull/189) | `60d908e6d024da201a31a19703c75880b0a7478d` | On #188 |
| R866 transaction-bound membership/deletion reads | [#190](https://github.com/LifeLoggerAI/urai-studio/pull/190) | `4ded87bb37916924018afc086f49ea59b35c14fa` | On #189; real Firestore race NOT certified |
| R867 owner-bound draft retry idempotency | [#191](https://github.com/LifeLoggerAI/urai-studio/pull/191) | `ca62b5a5b9a714cba34f8b9a8b513770c22a967c` | On #190 |
| R868 export retry idempotency and smoke test syntax repair | [#193](https://github.com/LifeLoggerAI/urai-studio/pull/193) | `c70bea0d10accbd9d6722dbef07d0a1a9901a5d3` | On #191 |
| R869 actual stored receipt/content consistency | [#196](https://github.com/LifeLoggerAI/urai-studio/pull/196) | `638e5cbebe98d8af15561a35f142baca14c94d25` | On #193; latest source review |
All listed PRs were **open/draft/unmerged** at this readback. Never rewrite peer branches, merge to main, deploy or create redundant PRs before inspecting existing work.

## 3. What has actually been built, and what is NOT certified
- Built source exists for Studio video/movie contracts, Memory-to-Life-Movie planning, selection/provenance/fingerprinting, protected transport candidates, drafts, prompts, jobs, export records, and integration proposals. Historical source-level Life Movie contract **9/9**, regression **4/4**, fingerprint **8/8** were reported at their original revisions; they are **not** claims of a passing current combined checkout.
- R860 onward deliberately classifies public Jobs/Video Factory/Export records as **draft / feature-gated / contract-only**, no authorized private rendering. R867/R868 added deterministic owner-scoped retry receipt admission; R869 added checks that stored job/export/brief semantics still match those receipts. None authorizes a private MP4/SRT.
- Local focused evidence across R863–R869 includes static GitHub checks and executed **synthetic** Node/TypeScript helper/transaction tests (e.g. R865 19/19, R866 15/15, R867 14/14 helper plus 14/14 job, R868 11/11 export, R869 30/30 focused after repairing five newly failing negative cases). Read each source report for its exact source and caveats. **Do not sum these into a single end-to-end certification**; many test fixtures overlap and all used simulated database/runtimes.
- The exact R869 candidate Git tree was reported **not truncated**, 1,229 entries / 928 Git blobs / 6,213,608 Git-reported blob bytes; **91** `apps/studio/tests/*.test.mjs` files passed a screening-only JavaScript parser after ESM import normalization. This is NOT a frozen install, full source-byte inventory, actual assertions, Next.js build or Firebase test.
- Existing original `functions/src/studio-system.ts` callable uses historical `uid`-centric `studioProjects` schema, whereas modern Next.js store uses `tenantId` and `userId`. **Owner-proven migration remains OPEN.** Historic `exportJobs` and modern `studioExports`, generic `jobs`/`jobRuns`/`deadLetters`, and owner export/deletion mapping are not one certified runtime.
- No evidence yet establishes a real **signed positive Privacy C6** consent grant → owner-verified sources → Jobs worker with Storage-level post-revocation fence → actual MP4/SRT derivation with source-to-output hashes → protected Spatial Replay → complete revocation/deletion → physical-device acceptance. **Production HOLD.**

## 4. The current actual native/CI blocker (R870/R871)
- Original source demands **Node 20**, **pnpm 9.7.0**, frozen `pnpm-lock.yaml`; local analysis container had Node22, lacked pnpm and complete source checkout, and `git ls-remote` could not resolve GitHub. Consequently original `pnpm --filter studio test/typecheck/lint/build` and Functions build were **not run** in this continuation.
- Existing `docs/estate/STUDIO_R870_NATIVE_ACCEPTANCE.sh` is **3,640 bytes**, Git blob `88732f9b26b2094a3136796b88a3655f20f3cb9c`, SHA256 `622faa837cfc0e6d4ce74063b114d615c7cfc21f39748f74f4575237e1e91524`; it requires exact source `638e5cb...`, clean checkout, Node20, pnpm9.7.0, no configured cloud credentials; runs frozen local install/tests/typecheck/lint/build/Functions build, hashes phases, always says production HOLD. Bash syntax PASS; fail-closed missing-pnpm preflight EXIT 77. It is **not yet a successful Studio execution**.
- At exact R869 SHA there were **three** failed GitHub Actions workflows `42422397884` data rights / `42422398093` Video Factory / `42422397924` production verify. At Genesis docs SHA `d8dc95abe096de28d93306ac98b810c4369cb956`, **four** more failed: `42432736509` Studio CI, `42432736476` Health Guard, `42432736469` Audit, `42432736484` production verify. GitHub readback: all affected jobs completed within seconds with `steps=[]`, no named runner and no usable logs. **No proof any native step executed or that application tests failed**.
- GitHub's October 18 2026 account email confirmed overdue subscriptions canceled and restricted metered usage. Separately, original GitHub Actions Asset Factory run `41792607935` job `126449246409` had an account-locked-due-to-billing annotation already included in **GitHub Support case #4889576**. That is strong account-wide runner-admission evidence; Studio's exact annotations remain inaccessible and GitHub has not yet confirmed Studio's specific cause. 2FA inaccessible interactively, but **connected GitHub tool works**. Do **not** buy compute, change billing/card, bypass 2FA, remove original owner data, make private repos public, or repeatedly rerun blocked workflows without owner authorization.
- GitHub Support historically discussed the possible no-charge free-features route only if no paid products remain. Seek an explicit owner-verified supported answer under existing case #4889576 rather than opening duplicates or claiming billing has been fixed.

## 5. Non-negotiable external gates
- **Jobs [P0 issue #252](https://github.com/LifeLoggerAI/urai-jobs/issues/252) is OPEN:** storage-enforced prevention of privileged **future writes after consent revocation**, plus drain of in-flight uploads. Firestore client Rules and preflight alone are insufficient.
- **Privacy signed positive C6 Life Movie consent** has no independently certified issuer/verified end-to-end admission. Privacy [draft PR #236](https://github.com/LifeLoggerAI/urai-privacy/pull/236) at `5daa194148c1f0b157062ca09b8f1b6e629d6d29` was still unmerged when checked; inspect latest Privacy worker findings.
- **Studio server-owned Rules** R858 #182 and R859 #183 are a separate lineage from R860–R869; verify Rules conflicts, worker/admin IAM, membership validation, realtime revocation, source lineage and deletion across Jobs/Replay before attempting integration.
- Cross-system source authorization must be enforced at the browser, API, Firebase Functions, Firestore, Storage, Studio, Jobs, render worker and Replay boundaries, including deleted/changed-generation receipts and no stale protected output after erasure.
- Prove actual render media from wholly fictional/synthetic owned inputs in disposable infrastructure first; no real private media absent independently verified valid owner consent. Preserve captions/accessibility, trauma-aware, multiple device paths, and the canonical journey.

## 6. Exact next worker execution order — NO RESEARCH LOOP
1. Fetch this handoff and latest [#180](https://github.com/LifeLoggerAI/urai-studio/pull/180) live head; read the master Labs `00_START_HERE` and Studio R854–R871 evidence, PR #175/#179/#182/#183/#184–#196. Compare current heads to this checkpoint; report any drift.
2. **Prioritize native verification over another source-only repair:** restore a lawful **zero-charge** Node20/pnpm9.7.0 native checkout and execute R870 runner on exact R869 SHA. Record actual exit codes, test output, app/Functions build, SHA256 receipts. Existing connected GitHub provides source and PR operations, not runnable CI. If no native runner is available, state precise blocker; do not call synthetic parser success a build.
3. Obtain exact current GitHub Actions annotation/runner-admission diagnosis via already escalated case #4889576 (no card/payment or 2FA changes). Avoid further meaningless failing hosted runs.
4. Independently reconcile R858/R859 **separate Rules/Jobs branch** with R860–R869 code. Review each PR/diff/lineage, reconcile schema/roles/indexes and historical storage records, and create a separate conflict-free review integration only when defensible. Never force-merge or deploy.
5. On clean combined source, run original full Studio Node tests, full typecheck/lint/Next.js build and Functions build; execute disposable four-service Firebase Auth/Firestore/Storage/Functions concurrency and revocation/deletion race tests, including identical-key lost HTTP ACK, changed payload, owner isolation, active fences, stale receipts, cross-user media denial, and zero privileged late writes.
6. Require positive signed Privacy C6 + Jobs Storage fence, owner-only Replay, real synthetic MP4/SRT plus signed source/output provenance and complete deletion/device evidence before even proposing production GO.
7. Append source-pinned results to existing knowledge packs in Genesis #180; record file sizes/hashes, inaccessible sources and truth categories, and leave the production hold intact.

## 7. Hard rules for the next Chalk
**Do:** execute with connected GitHub/authorized tools, preserve existing built systems and prior worker work, compare exact refs/SHAs and full source where relevant, make only evidence-backed isolated repairs, publish a clear status ledger. **Do not:** claim real private movie success from contract tests; fabricate CI passes, log hashes or URLs; re-run previously counted tests as new evidence without exact run records; process private media without verified consent; charge Runpod/Vercel/cloud; edit production or merge to main without independent source/runtime/security authorization.

**One UrAi Genesis: real systems already built. Studio complete forensic record preserved; secure production private Life Movie end-to-end NOT YET CERTIFIED. HOLD.**
