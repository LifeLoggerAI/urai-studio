# One UrAi Genesis — Studio R860 contract-only draft receipts and media acceptance scope

**Checkpoint:** 2026-11-07 UTC; **production and positive private Life Movie HOLD**. Independent audit continuation from R859, preserving original worker engineering and master Labs registry.

## Isolated engineering review
New draft [Studio #184](https://github.com/LifeLoggerAI/urai-studio/pull/184), head `085573ca9ac36cc594a3b0bf267aff5255c43e3c`, branched from exact candidate #179 `153d6c35557c66a8b9f8629778ca796b83730464`, not merged and not deployed. It has no dependency on the distinct R858/R859 security change branches and does not modify them.

### Verified historical behavior
- Configured `functions/package.json` entrypoint is compiled `lib/index.js` from `functions/src/index.ts`; TS config includes only `src`. The separate top-level `functions/index.ts` is historical dummy `studioJobs` worker code creating a sample output URL; it is **not part of configured compiled Functions entrypoint**. Do not count it as a deployed renderer.
- The Next.js `createStudioJob` system persists `studioJobs` with provider `feature-gated` and model `contract-only`. The Next.js Studio exports persist `studioExports` with no downloadable artifact. These are persisted plans, not Jobs worker admissions or successful MP4 rendering.
- Video Factory POST and its UI previously labeled stored records `queued`, which could be mistaken for actual worker execution. The real private Life Movie transport/Jobs authority and signed Privacy C6 remain separate and unavailable.

### Draft R860 change
- New writes to modern Studio contract-only job/export documents have status `draft` (a preexisting valid status), not `queued`.
- The three Studio POST APIs return HTTP 202, `persisted:true`, `status:'draft'`, and `execution` with `mode:'contract-only'` plus `workerDispatched:false, outputVerified:false, mediaRendered:false, privateRenderConsentAuthorized:false`.
- The Replay Teaser UI fails closed on missing/inconsistent execution evidence, displays *saved draft*, and does not claim a film, while preserving original authentication and unconfigured production refusal.
- Added original `.test.mjs` to the existing auto-discovered Studio suite and a source evidence ledger in #184. Source-read file hashes are in `docs/estate/STUDIO_R860_DRAFT_EXECUTION_RECEIPT_REVIEW_20261107.md` on #184.

## Verification classification
**15/15 connected-source checks PASS**: draft statuses/valid union, route response content, UI rejection of missing execution receipt, advertised no-provider facts, automatic test discovery and historical Functions entrypoint exclusion. These are **source assertions, not original native test execution**. Node22/Java21 present, pnpm/frozen workspace and Firebase CLI/SDK unavailable; no full app/Functions build, four emulators, provider binaries or private media run here.

## Additional blockers newly clarified
1. **Worker/source model**: no certified renderer consumes newly created `studioJobs` records; historic dummy cannot be imported as live proof. Separate `jobs` fallback and governed external Jobs worker remain independent.
2. **Migration risk**: old API consumers may expect `queued` when persistence succeeds; staged API/version compatibility must be reviewed independently before merging.
3. **Atomicity**: `createStudioJob` writes the Studio job record before independently writing a prompt brief. If the second write fails, the record may persist while POST fails or produces no receipt; retries risk duplicates. Require idempotency/batch or transactional admission.
4. **Owner deletion**: `studioJobs` is in data-rights inventory, but generic historic jobs/jobRuns/deadLetters remain outside that inventory; complete erasure remains unverified.
5. **Security and private film**: R857 diagnostic #181, R858 authorization #182, R859 worker history #183 remain unmerged; Jobs #252 privileged storage post-revoke writes unresolved; trusted positive C6 and genuine authorized Life Movie→owner-only Spatial Replay→full deletion still HOLD.

**Next native acceptance:** fresh exact #184 build, original `apps/studio/tests/all.test.mjs`, authenticated disposable tenant draft creation, no worker invocation, no output URL, old queued record coexistence, idempotent failure tests, then independent reviewed integration. No private files or paid compute until explicitly authorized.
