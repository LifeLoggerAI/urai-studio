# One UrAi Genesis — Studio R867 deterministic draft idempotency

**2026-11-07 UTC / CST. Draft-only, unmerged, not deployed. Production HOLD.**

**Exact parent:** Studio R866 [#190](https://github.com/LifeLoggerAI/urai-studio/pull/190) commit `4ded87bb37916924018afc086f49ea59b35c14fa`; movie candidate ancestor [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179) `153d6c35557c66a8b9f8629778ca796b83730464`. Other active worker and canonical Genesis PR branches left untouched.

## Actual defect and narrow proposed fix
A successful `studioJobs` + prompt brief/project transaction followed by a lost HTTP response could previously cause a second POST to create a new `job_...` and another project/brief because IDs were random. This was **contract-only draft persistence**, not a rendered private Life Movie.

- New `apps/studio/lib/studio-draft-idempotency.ts`: validates a 16–128-character header `x-urai-studio-idempotency-key` and derives a SHA-256 deterministic job document ID from (version, verified tenant, verified owner, key). A second digest binds normalized project/brief references, kind, prompt and requested exports. **Only digests**, never the raw key, persist on the `StudioJob`. No new collection, IAM or provider.
- `createStudioJob` inside the existing R866 Firestore transaction: recheck current membership/fences, then read deterministic `studioJobs/{id}`. An existing draft with exactly matching owner, tenant, key/body digests and explicit `draft/feature-gated/contract-only` identity returns the *original* record and `replayed:true`, with no writes. Changed request under same key returns `studio_idempotency_conflict`; replay also re-reads the prior project and brief, denying deleted or reassigned references. Initial successful request creates project, prompt brief and job atomically, `replayed:false`.
- `/api/studio/jobs` and `/api/studio/video-factory` require a valid key header (400 if absent/invalid), return 409 on changed-payload conflict, and include replayed flag on the ordinary HTTP 202 persisted `draft` receipt. The independent private Life Movie Jobs bridge does not accept this key as signed consent.
- Replay Teaser button uses `crypto.randomUUID()`, retains the same key in a React ref after timeout/lost response, resets it when the payload changes, and clears it only on successfully verified saved draft. A new browser session may generate a new key; cross-session retry persistence is not implemented.
- Legacy direct internal callers without an idempotency key remain non-idempotent for compatibility. The **two public draft POST routes** now require keys, so clients depending on headerless POST must migrate before merge. Exports POST remains outside this R867 scope.

## Exact GitHub readback
| File | Git blob SHA |
| --- | --- |
| `apps/studio/lib/studio-draft-idempotency.ts` | `9d1ada2c116ba2c917595f30e221d3f55c22a907` |
| `apps/studio/lib/studio-runtime-store.ts` | `b731d03e9d4a14a8084ef4836ee2506ad305aa91` |
| `apps/studio/lib/urai-system-contract.ts` | `f73b1eb712a50626d120f3d02824b89eaff9ed8d` |
| `apps/studio/app/api/studio/jobs/route.ts` | `fbaa7a213a7470a8543dd27c43a194d8842050c8` |
| `apps/studio/app/api/studio/video-factory/route.ts` | `08c501bdfcb58eb5c8fda5cc1d7e03e5063c6644` |
| `apps/studio/app/studio/video-factory/QueueReplayTeaserButton.tsx` | `501ca49781885506f7f53729c387f481447e1763` |
| `apps/studio/tests/studio-draft-idempotency-r867.test.mjs` | `ca97b4a9e23bf2eff656b78135ec0e487a09919e` |

## Actually executed
Local isolated container Node **22.16.0**, TypeScript **5.8.3**, no network or Firebase credentials:
- Copied exact new TypeScript digest helper source, verified `git hash-object` `9d1ada2c116ba2c917595f30e221d3f55c22a907` against connected GitHub blob; local raw SHA256 `ffa9b2b56ef86b302df79044f06e54a45fdc3cb020c6fd0a0c8b74b5ebbfafdf`. Executed actual TypeScript-transpiled helper with original Node crypto: **14/14 PASS**, TAP SHA256 `36c17c4b4ae31dd205af80f3296c83d4d970c2995e430822abbfc40d0cff5f36`.
- Reconstructed **exact `createStudioJob` TypeScript function extract** from GitHub readback: 6,635 UTF-8 characters/bytes, computed FNV1a `5522aded` matches independently computed GitHub source extract, raw local SHA256 `133bac2a0078f48bbfbcfeb75c3cc58992609fdc93d7583ec67354c0151cf14c`. Transpiled and ran it against an *in-memory serializable transaction double*: **14/14 PASS**, TAP SHA256 `2aa0e404a88268a4c88b41a3ab2a2460c605f2a776b808092d34ecbfd54ac530`. Scenarios: same key/owner/body lost-ACK replay, changed prompt/exports/kind/project conflict, tenant and user isolation, three concurrent requests yielding one draft, failed commit/retry, revoked actor denial, digest-less spoof rejection, digest-only storage, legacy no-key behavior, deleted project and reassigned brief refusal.
- Isolated strict `tsc --noEmit --strict --target ES2022` against extracted function and local type declarations **PASS**. This is NOT an original full Studio typecheck/build.
- Fresh connected-GitHub readback source invariants **25/25 PASS** across helper, store, contract, both public routes, UI, and checked-in regression file.
- The *checked-in* 14-case `studio-draft-idempotency-r867.test.mjs` is committed and auto-discovered by `apps/studio/tests/all.test.mjs`, but was **NOT run in the full repo checkout**. No original frozen Node20/pnpm9.7.0 Studio test/build, native Auth/Firestore/Storage/Functions Firebase emulator or live provider was run.

## Exact remaining native and security gates
1. Run frozen exact-source Studio tests, typecheck, Next.js build and Functions build at the R867 review head; preserve stdout/stderr SHA256 and lockfile/commit identity.
2. Run disposable authenticated Firebase Admin concurrent transactions with identical keys under real Firestore contention: enforce one persisted project/brief/job and identical returned receipts; changed body=>409; revoked membership/fence creation between reads/commit=>denial and zero new bytes; failed transaction retry=>exact one create. Synthetic serialization is **not proof** of native transaction conflict/retry behavior.
3. Validate real Next.js routes with authenticated owner/viewer/foreign actor, headerless older clients (must receive 400), invalid/new key, fresh/retry/lost response, source reference deletion, and safe HTTP error mapping. UI must retain key after timeout and release it after validated 202. Consider retaining keys across page reload if product requires cross-session idempotency.
4. Review mandatory new header API compatibility before merge. R867 does **not** make standalone `createStudioExport`, standalone `createStudioBrief`, `createStudioProject` or legacy non-key internal jobs idempotent.
5. R858/R859 Firestore Rules and R860-R867 stacked API PRs remain unmerged; owner erasure of generic `jobs`/`jobRuns`/`deadLetters`, old `uid` schema, and real worker convergence are separate gates.
6. Positive private Life Movie consent is still hard-off, Jobs [P0 #252](https://github.com/LifeLoggerAI/urai-jobs/issues/252) privileged Storage future-write prevention unresolved; source→authorized MP4/SRT→owner-only Replay→revocation/deletion→device acceptance not certified.

**This is draft record idempotency, not generation authorization or production GO. No real private media, paid resources or deployment.**
