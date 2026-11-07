# One UrAi Genesis — Studio R861 atomic draft and brief acceptance handoff

**2026-11-07. Production HOLD.** Review-only stacked engineering [Studio #185](https://github.com/LifeLoggerAI/urai-studio/pull/185), head `2db179f0c69943d032bc94a871ad974e82f5d44a`, based on R860 [#184](https://github.com/LifeLoggerAI/urai-studio/pull/184) `085573ca9ac36cc594a3b0bf267aff5255c43e3c` (source descends from Studio movie candidate #179). Existing R858 #182, R859 #183 and active worker branches unchanged.

## Scoped executable result
- Source defect: `createStudioJob` previously persisted a `studioJobs` draft and then independently created a `studioBriefs` prompt. A failure on second write could leave an orphaned draft and an ambiguous failed response.
- Review-only correction: one Admin Firestore batch `create(job)` + optional `create(brief)` + `commit()`; job carries the actual new brief ID when a new prompt is saved. Draft stays `model:'contract-only'`, `provider:'feature-gated'` and never executes media generation.
- New `apps/studio/tests/studio-atomic-job-brief-r861.test.mjs` auto-discovered by original Studio all-tests runner. The original function was reconstituted/executed in a container using Node22+TypeScript against a **synthetic atomic Admin batch**, 6/6 PASS with TAP SHA256 `4293986189e3563c29fe7c10d2deb89718799e0266ec8bafa63f4f3d22fc53aa`. The exact 2258-byte fragment matched connected GitHub source hash check; original full Store source Git blob `3bb16a52aa2f5ea1fd0c1debbb765a6f42105ef9`. Strict local TS check with type stubs also PASS.
- Exact test/harness/source SHA256, compatibility considerations and next tests: `docs/estate/STUDIO_R861_ATOMIC_DRAFT_PERSISTENCE_REVIEW_20261107.md` in PR #185. No complete native repository checkout, pnpm, original full Node20 app/Functions build or Firebase emulators in this pass.

## Still unverified
1. Real authenticated tenant/project ownership: existing POST takes caller-supplied `projectId` and optional `briefId`; batch semantics do not prove actor ownership or signed source rights.
2. Idempotency: lost HTTP receipt after a successful commit may still duplicate a draft on retry; deterministic owner+request-bound idempotency and transaction conflict protection remain P1.
3. Stored legacy `queued` records versus newly introduced R860 `draft` records need API/worker migration and native emulators.
4. R858/R859 server-owned job/audit/worker evidence security fixes remain separate unmerged reviews. Jobs #252 privileged post-revocation Storage write fence remains open, Privacy C6 trusted positive consent hard-off; real protected MP4/SRT, owner-only Replay and deletion acceptance not performed.
5. Run exact #185 Node20/pnpm9.7.0 frozen Studio suite/typed build/Functions build, disposable Auth+Firestore+Storage+Functions acceptance, cross-owner denial, failed commit, retry-after-timeout, and exact source hashes with independent reviewer before any merge.

No production, IAM, paid compute, private media or active worker source changed. **Release HOLD.**
