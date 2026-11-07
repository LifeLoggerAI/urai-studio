# One UrAi Genesis — R859 Studio worker evidence and job-wiring reconciliation

**Date:** November 7, 2026. **Status:** security source proposals OPEN, native emulator NOT RUN, Life Movie private end-to-end production HOLD.

## Independent stacked engineering PR
[Studio #183](https://github.com/LifeLoggerAI/urai-studio/pull/183) is a *draft stacked on* [#182](https://github.com/LifeLoggerAI/urai-studio/pull/182), commit `c0f21ff57ad2f6b3525f1f756df6ae7126c4dfc4`, with no merge or deployment.

- R858 #182 prevents clients from writing `jobs` and `auditLogs`. R859 #183 also prevents direct Studio clients from create/update/delete on `jobRuns` and `deadLetters`, but preserves authenticated tenant member reads and leaves unrelated client-owned `clipRequests`/`assets`/`outputs`/Storage compatibility unchanged.
- Seven synthetic emulator test declarations added to the original `security-tests/studio-memberships/membership.test.mjs` (six role-by-collection write/immutability cases plus member/cross-tenant read continuity). Both R858 and R859 are **source-only**, not installed rules or proof of native emulator PASS.
- Exact Git blobs on #183: `firestore.rules` `83d75d2a2cf8533ba0c4832e2144aa9b32d9695b`; `membership.test.mjs` `f98e727f98f0246841540a7ca5e72f5515b7bd9e`. Compared read-back bytes to exact R858 base: **15/15 static source-structure checks PASS**, not native tests.
- Complete review details: `docs/estate/STUDIO_R859_RUNS_DLQ_AND_JOB_WIRING_20261107.md` inside #183.

## Independently recovered three different job paths on Studio #179
**Source** `153d6c35557c66a8b9f8629778ca796b83730464`; **23/23 direct GitHub source-structure checks PASS**, only assertions about the checked-in source:

| Path | Exact source and Git blob | Source-level behavior | Verified integration deficit |
| --- | --- | --- | --- |
| Next.js REST job creation | `apps/studio/app/api/studio/jobs/route.ts` `767286f3f5295f7e7391a717eb4ed33b4caca2d8` → `studio-runtime-store.ts` `1aeb816a71387681c659f9ceb9a13866261d4b2d` | Authenticated Admin writes `studioJobs` using `status:'queued'`, tenantId and userId; data-rights inventory includes this collection | No proof that fallback worker queries `studioJobs` or that a new job becomes a playable output |
| Functions `createJob` | `functions/src/create-job.ts` `de3519fe24f0994c4ee59f4c8bd86b0afcd3f97d` | Owner/project verification then Admin `jobs` with `state:'queued'`; lacks `studioId` and emits audit entries without that tenant field | Current member-only Firestore reads of these jobs/audit entries require `resource.data.studioId`, so callable-created records may not be readable by membership clients without a separate compatibility mapping; needs native tests |
| Legacy upload finalization | `functions/src/finalizeUpload.ts` `913439ee69a75f9ad80db4fabc88665779860dc1` | Writes `jobs` using `status:'queued'` and `type` | `functions/src/index.ts` `903e21a584703f3dbffffe23a8dd948189af88a9` does **not export** this handler; scheduler queries `state`, so source presence is not proof of connected execution |
| Fallback worker | `functions/src/job-runner.ts` `78e3a54212eb30eb1cc9752a84a5daa91232da13` | Polls `jobs.state='queued'`, writes fallback-only markers and GCS files | Not a real private Life Movie worker; no positive C6 render authorization |
| Separate Jobs Life Movie bridge | `apps/studio/app/api/studio/video-factory/jobs-dispatch/route.ts` `4a838869960ea1bb135e3dd172b68712c71aa67f` | Explicit consent-shaped transport to external Jobs service | Positive grant hard-off; cross-system native negative test only |
| Historical duplicate entry | `functions/index.js` blob `573a67ac3c9bb6852fc34795c7bf6968c284767d` | Another historical job pipeline | `functions/package.json` `1d8d0f3d24e22887834b4398e1fa2ef17e83522f` selects compiled `lib/index.js`, not this file |

## Owner rights and data deletion scope
The original `functions/src/data-rights.ts` Git blob `4a53f55028100079232d9af4db5129b45e282c51` inventories `studioJobs`, `studioExports`, and `studioBriefs` but **not** generic `jobs`, `jobRuns`, `deadLetters`. This is a material scope reconciliation requirement; do not infer complete owner export/deletion from the narrower inventory. Existing job queue records may also lack `studioId`, even though the Rules tenant reader checks require it.

## Exact remaining native tests
Clean checkout of R859 #183, Node22/Java21, `cd security-tests/studio-memberships && npm ci --ignore-scripts --no-audit --no-fund && npm test && npm audit` on original disposable Firestore/Storage emulators. Preserve source/lockfile hash, logs, all prior tests and seven new cases. Then cross-check Admin callable-created job visibility, scheduled fallback processing, legacy queued records and data-rights inventory under authentic ownership. Reconcile production Firebase project, rules/IAM and current deployed Functions against the exact source; protect private Life Movie data separately through Jobs #252 fence + signed Privacy C6.

**No emulators, deployed Rules, production write, real media, paid pod or positive C6 run in R859.** Keep release HOLD.
