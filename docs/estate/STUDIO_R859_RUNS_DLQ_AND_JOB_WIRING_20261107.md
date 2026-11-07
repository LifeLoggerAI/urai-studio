# Studio Genesis R859 — worker-owned run and dead-letter authority

**Review only | 2026-11-07 | production HOLD.** Branch is stacked on R858 #182 (commit `c0df95eaef976c10b4f5b611060f83ac1c4e035a`), which itself is based on movie candidate #179 `153d6c35557c66a8b9f8629778ca796b83730464`. This does **not** touch the active movie source branch, private data, or production.

## Why this correction matters
- Current `firestore.rules` allowed any `owner`, `creator`, or `viewer` Studio member to create/update `jobRuns` (worker attempt history) and `deadLetters` (failure and retry evidence), with tenant owners allowed to delete. There was no worker signature, immutable attempt identity or source-to-job binding enforced at this client boundary.
- Original `docs/ARCHITECTURE.md` (Git blob `068a5445a8a465a88ad69fb3f78654b96cb3cbf0`) describes `jobRuns` as job attempt records; `docs/STUDIO_FRIEND_MODE_PLAN.md` (Git blob `2084f0bb9dd333dd2279771d67db62f400085037`) includes dead letters and job runs in its system model, but **does not mandate direct client creation of worker evidence**.
- A GitHub code search over default-branch sources found no current explicit `jobRuns` or `deadLetters` client writer; this is only search evidence, not a proof that deployed/archived clients never write.
- Current `apps/studio/lib/studio-runtime-store.ts` (Git blob `1aeb816a71387681c659f9ceb9a13866261d4b2d`) writes `studioJobs`, a separate Admin-owned job store. These are *not the same* as `jobs`, `jobRuns` or `deadLetters`.

## Minimal stacked changes
1. Preserve tenant-member reads of `jobRuns` and `deadLetters`; deny all direct client `create, update, delete`. Admin SDK is not constrained by client Rules and remains separately accountable.
2. Original `membership.test.mjs`: remove these collections from old mutable tenant compatibility cases; add seven emulator cases (three roles × two collections, plus cross-tenant read/seed continuity). Existing Studio output, clip-request and asset write compatibility tests remain intact.
3. R858 `jobs`/`auditLogs` server authority changes are unchanged. Explicitly **not** a new hard-off of other Shared Studio output prefixes.

## Evidence classification
- R859 current branch Git blobs: `firestore.rules` `83d75d2a2cf8533ba0c4832e2144aa9b32d9695b`, original adapted membership tests `f98e727f98f0246841540a7ca5e72f5515b7bd9e`.
- **15/15 connected-GitHub source structure comparisons PASS**, across R859 vs R858 exact parent: denial, tenant read preservation, unaffected legacy collections and retained earlier tests.
- **Native Firebase Security Rules emulator NOT RUN**. Node22 and Java21 available locally but Firebase CLI, installed `@firebase/rules-unit-testing` and full checkout unavailable; the GitHub connector is read/write and cannot replace native execution. No native compile, full Studio build or production Rules check claimed.

## Additional system-of-systems findings
- **Three noninterchangeable job paths**: live Next.js `/api/studio/jobs` calls `createStudioJob` writing `studioJobs` with `status`; Firebase `createJob` writes `jobs` with `state`; legacy `finalizeUpload` writes `jobs` using `status` and `type`, but `functions/src/index.ts` does not export that legacy function. The current scheduler queries `jobs` for `state=queued`. Do not assert that a POST to `/api/studio/jobs` results in fallback worker execution.
- `functions/package.json` selects `lib/index.js`, the compiled output of `functions/src/index.ts`; checked-in top-level `functions/index.js` is another historical job pipeline, not the declared Functions entrypoint.
- `functions/src/data-rights.ts` owner inventory includes `studioJobs`, `studioExports`, `studioBriefs`, but not generic `jobs`, `jobRuns`, or `deadLetters`. Owner deletion and data export coverage of these historical collections requires independent reconciliation before saying complete erasure.
- Verified **23/23** exact GitHub source-wiring assertions on `#179`. These prove static source structure only, not that historical handlers are deployed or that any consumer job reached the correct worker.

## Next acceptance
Run `npm ci --ignore-scripts --no-audit --no-fund && npm test && npm audit` from `security-tests/studio-memberships` on a clean exact R859 SHA with Node22+ and Java21. Use disposable Firebase Firestore/Storage emulators. Demand 7 new denial/read cases plus complete original membership/deletion-fence suite. Independently test authentic server Admin creation, tenant access and scheduled worker behavior, including an old client-created queued job, malformed project IDs, deletion and priority races, and post-revoke permission changes. Then reconcile collection-specific owner export/deletion and the Next.js `studioJobs` worker wiring as separate reviewed PRs.

**Keep P0 Jobs #252 Storage future-write fence, positive signed Privacy C6 and real protected Life Movie→Replay→deletion HARD OFF.**
