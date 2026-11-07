# One UrAi Genesis — Studio R867 draft retry idempotency handoff

**2026-11-07 UTC · Production HOLD · Review-only.** New independent stacked engineering draft [Studio PR #191](https://github.com/LifeLoggerAI/urai-studio/pull/191), head `ca62b5a5b9a714cba34f8b9a8b513770c22a967c`, based on R866 [#190](https://github.com/LifeLoggerAI/urai-studio/pull/190) `4ded87bb37916924018afc086f49ea59b35c14fa`. The prior authorization/consent and other workers' branches were not merged, overwritten or deployed.

## Concrete change
- Old behavior: lost HTTP 202 after an atomic `studioJobs` draft creation would allow POST retry to produce another random project/brief/job. R867 introduces required `x-urai-studio-idempotency-key` on public Studio Jobs and Video Factory POST routes.
- New `studio-draft-idempotency.ts` derives an actor/tenant/key-scoped stable draft job document ID plus a request content digest; persists only SHA256 digests. The R866 Firestore transaction rechecks member/deletion authority, reads the prior job and returns original unchanged draft on exact same request. Conflicting payload under same key => HTTP 409; missing/invalid key => HTTP 400. Prior project and brief ownership are also rechecked on replay, so a deleted/reassigned source does not produce a successful stale receipt.
- `QueueReplayTeaserButton` reuses one UUID key across retries/timeouts of the same payload, changes key when payload changes, clears after confirmed draft, and still refuses to claim a movie render.
- This explicitly covers contract-only Studio **job drafts**; standalone export/brief/project requests, old internal no-key callers and browser reload retries remain separate work. Existing API clients need a migration for the now-required POST header.

## Evidence and exact source
- Connected GitHub Git blobs: helper `9d1ada2c116ba2c917595f30e221d3f55c22a907`; Store `b731d03e9d4a14a8084ef4836ee2506ad305aa91`; Job types `f73b1eb712a50626d120f3d02824b89eaff9ed8d`; Jobs route `fbaa7a213a7470a8543dd27c43a194d8842050c8`; Video Factory route `08c501bdfcb58eb5c8fda5cc1d7e03e5063c6644`; Replay Teaser UI `501ca49781885506f7f53729c387f481447e1763`; new `studio-draft-idempotency-r867.test.mjs` `ca97b4a9e23bf2eff656b78135ec0e487a09919e`.
- Exact helper source verified against Git blob, executed with actual Node22+TypeScript and Node crypto **14/14 PASS**, TAP SHA256 `36c17c4b4ae31dd205af80f3296c83d4d970c2995e430822abbfc40d0cff5f36`.
- Reconstructed exact current `createStudioJob` TypeScript function body from connected GitHub, 6635 bytes/FNV1a `5522aded` matching GitHub extract; executed against an isolated in-memory serialized transaction double **14/14 PASS**, TAP SHA256 `2aa0e404a88268a4c88b41a3ab2a2460c605f2a776b808092d34ecbfd54ac530`. Isolated strict TypeScript with local declarations **PASS**.
- GitHub static source assertions **25/25 PASS**. New checked-in 14-case test **NOT** run in original full repository. No frozen Node20/pnpm9.7.0 Studio+Functions build, native Firestore/Auth/Storage/Functions emulator concurrent race, hosted CI or production run this turn. These distinctions must survive future certification claims.
- Complete R867 evidence including source/data hashes, changed HTTP contract, detailed negative and race tests: `docs/estate/STUDIO_R867_IDEMPOTENT_DRAFT_ADMISSION_REVIEW_20261107.md` inside #191.

## Remaining exact release blockers
1. Clean exact #191 full frozen Studio + Functions native test, typecheck and build, actual four-Firebase-emulator same-key simultaneous writers and permission-revocation-between-read/commit proof. A synthetic serial transaction is NOT actual Firestore concurrency proof.
2. Cross-session idempotency and API header compatibility; standalone Studio export/brief/project idempotency and reliable client behavior after HTTP ACK loss remain open outside the two guarded routes.
3. All R858/R859 client Security Rules and R860-R867 API fixes are draft/unmerged, not deployed; older `uid` projects, owner-erasure inventory and production source parity remain open.
4. Positive Privacy C6 signed consent and Jobs [P0 #252](https://github.com/LifeLoggerAI/urai-jobs/issues/252) privileged GCS post-revoke future-write denial remain **HARD-OFF**. No private Life Movie MP4/SRT, owner-only Replay, deletion and physical-device certification yet.

**No private media, production writes, billing, IAM changes, provider activations or merges performed. Genesis production HOLD.**
