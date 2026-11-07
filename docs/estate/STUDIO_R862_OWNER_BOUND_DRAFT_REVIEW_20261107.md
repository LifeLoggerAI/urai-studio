# One UrAi Genesis — Studio R862 owner-scoped atomic draft admission

**Date:** 2026-11-07. **Source base:** Studio R861 #185 commit `2db179f0c69943d032bc94a871ad974e82f5d44a`; original Life Movie candidate #179 `153d6c35557c66a8b9f8629778ca796b83730464`. **Draft review only — production HOLD.**

## Exact repair
- `apps/studio/lib/studio-runtime-store.ts` `createStudioJob` now uses one Firebase Admin Firestore `runTransaction`, with **all project and existing-brief authorization reads BEFORE any writes**.
- Explicit `projectId`: load `studioProjects/{id}` within transaction; deny absent project `studio_project_not_found` and mismatched `tenantId` or `userId` `studio_project_forbidden`.
- Existing `briefId` used without a new prompt: fetch `studioBriefs/{id}`; deny nonexistent `studio_brief_not_found`; require exact project + tenant + user match `studio_brief_forbidden`.
- No project ID: create a real minimal `StudioProject` for the current actor, same transaction as the `draft` job and optional prompt brief. This preserves the existing Video Factory default-template flow without permitting a dangling generated project identifier.
- New prompt: create brief with exact job/project/tenant/owner binding, in the same transaction. When both new prompt and old brief ID supplied, the new prompt wins (R861 behavior preserved). No media, output or Jobs worker is created.
- New job remains `status:'draft'`, `provider:'feature-gated'`, `model:'contract-only'`. Separate Privacy C6 hard-off and Jobs #252 privileged Storage post-revocation fence are untouched.

## Scope and verification
- Isolated source `apps/studio/lib/studio-runtime-store.ts` Git blob `1cb7e491619a95015f39ff433a668ef46fb6e018`.
- Adapted original `apps/studio/tests/studio-atomic-job-brief-r861.test.mjs` Git blob `140881d0fa614a466628ee355e935a721ffbae89`, now covers owned explicit project + linked brief, atomic implicit project+brief+job, missing project, cross-tenant project, cross-owner project, existing brief, missing/foreign/wrong-project brief, transaction-failure zero writes, unconfigured Admin, new prompt precedence, and absence of output media.
- **17/17 GitHub source invariants PASS** after reading both exact blobs, checking all authorization comparisons, transaction sequencing, implicit owner project, draft-only hard-off and test declarations. These are **static source checks, NOT native tests**.
- Local host Node22.16.0 and TypeScript 5.8.3 available, but GitHub clone DNS fails and original pnpm/Firebase dependencies unavailable. The prior R861 **6/6 mock-batch evidence is not transferrable** to changed R862 transaction code; revised checked-in test has NOT been executed here. No current full TypeScript app/Functions build, Firebase emulators, provider render, deployment or authenticated private media certification.

## Remaining threat and compatibility investigation
1. `createStudioProject` separately accepts caller-defined IDs and performs `.set(...,{merge:true})` without validating that an existing document belongs to the caller; **separate project-upsert boundary review necessary** before a broader Studio launch.
2. `createStudioBrief` and `createStudioExport` separately accept project/asset/job references without ownership checks; an R862 job-only guard does **not** certify these routes or delete/export rights.
3. Existing R861 caller `briefId` with new `prompt` is intentionally overridden. Confirm no dependent UI expects the older attachment.
4. Retry after successful transaction followed by lost HTTP receipt still generates a different ID: **idempotency remains OPEN**, not solved by transaction atomicity. Client request idempotency keys must be bound to authenticated uid+tenant+body digest, with replay result and conflict denial.
5. Transaction read/write interleavings, deleted projects, simultaneous ownership transfer, and Firestore rule-vs-Admin discrepancies require real disposable emulator tests.
6. Existing `jobs`, `jobRuns`, `deadLetters` and `studioJobs` owner-erasure and permissions audits remain independent; R858/R859 Rules PRs unmerged.
7. Trusted Privacy C6, Jobs P0 #252 storage-enforced future-write denial, real authorized private source->MP4/SRT->owner-only Replay->revocation/delete and release GO remain HOLD.

## Ordered exact acceptance
- On clean R862 SHA: Node20, pnpm9.7.0 frozen install; `pnpm --filter studio test`; `pnpm --filter studio typecheck`; `pnpm --filter studio build`; `pnpm --dir functions build` and original release gate. Capture raw logs, SHA256, source/lock hashes and commit.
- Native Auth+Firestore+Storage+Functions disposable project (Java21): prove owner allowed, tenant/owner mismatch denied, missing/wrong project/brief denied, permission change during transaction race denied, implicit project+job+brief atomic, failed commit absent, all status draft/no outputs, no private media.
- Independently review project creation/upsert, standalone brief/export writes, retry idempotency and response error classifications before any merge.

**No production writes, cloud IAM/rules changes, rendered private media, paid compute or merges performed.**
