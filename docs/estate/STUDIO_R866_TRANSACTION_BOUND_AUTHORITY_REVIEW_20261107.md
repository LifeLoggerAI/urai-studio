# One UrAi Genesis Studio — R866 transaction-bound authorization (2026-11-07)

**Classification:** isolated, draft, source-pinned security review; **not native Firebase runtime certification**. Source parent Studio [#189](https://github.com/LifeLoggerAI/urai-studio/pull/189) `60d908e6d024da201a31a19703c75880b0a7478d`. Unmerged. No cloud deployment, live user media, positive render consent, or paid compute.

## Exact security gap
R865 authenticated the member and checked current role, tenant membership, hashed Studio owner deletion fence and canonical privacy tombstone before the route's write. The subsequent Admin Firestore transaction created `studioJobs`, `studioBriefs` or `studioExports` without rereading these controls **inside** that transaction. Concurrent member revocation or owner deletion could therefore occur after the preflight and before commit. Admin writes bypass client Security Rules. Previous preflight evidence is not a storage-enforced revocation fence.

## Narrow proposed repair
- `apps/studio/lib/studio-member-auth.ts` reuses the **same** canonical member/role/fence policy for existing preflight and new `assertStudioDraftAuthorityInTransaction(transaction, uid, tenantId)`. It reads `studioUsers/{uid}`, `memberships/{uid}_{tenant}`, `studioDataRightsOwnerFences/{sha256('urai-studio-data-rights:'+uid)}` and `privacyDeletionTombstones/{uid}` through four `transaction.get` calls, including when fences are absent. Rejects missing/revoked membership, wrong roles, live/permanent/malformed owner fences, tombstones and planning leases.
- `apps/studio/lib/studio-runtime-store.ts`: every Admin transaction in `createStudioBrief`, `createStudioJob`, and `createStudioExport` calls that helper *before* project, brief, job, asset or write operations. The original route preflight and POST recheck remain in place. R862 project/brief ownership checks and R863 export owner/source restrictions remain unchanged. New objects remain `draft`, `feature-gated`, `contract-only`; no worker or private media enabled.
- Original focused R862/R863 synthetic mocks have a **documented stub** for transaction admission so existing project/reference tests remain isolated. Their mocks do NOT prove the R866 permission path; the new dedicated test does.
- Added `apps/studio/tests/studio-transaction-bound-authority-r866.test.mjs` (9 checked-in source-function tests) to the original automatically discovered Node suite.

## Verification performed
1. Locally constructed TypeScript helper source is exactly **6455 UTF-8 bytes**, raw SHA256 `ad3a78687592e69e89c511f39892356cf399a03ba9e139a294f90e75b1aa9745`; computed Git blob `3facfc23c3b626bae479ea3d7ba40fa1217d1d63`, equal to connected GitHub readback.
2. Node 22.16.0 + globally installed TypeScript 5.8.3; **strict isolated TypeScript check PASS** using declared Firebase/Admin stubs (`tsc --noEmit --strict --target ES2022`). This is *not* a complete Next.js/Functions build.
3. Executed the exact transpiled helper against synthetic read-only Firestore transaction snapshots: **15/15 PASS**, zero failures/skips, TAP SHA256 `b7ba6d10e506260acb4fa0cbdee86904293d7e06b59b6769b8538f86dd8c8e0d`, runner SHA256 `1f7b90b12a81cb4fbcc5dc0fb51998b6482f22e5829b989729d77338d3a4c1f3`. Test covers owner, editor, viewer, missing/disabled/revoked membership, active/permanent/malformed owner fence, pending deletion planning, backend failure and four read-set dependencies. A synthetic change after read only demonstrates that fence references are in read set; **the mock does not enforce Firestore retry/commit conflict semantics**.
4. Connected-GitHub readback of complete source paths and test code: **19/19 static source-structure assertions PASS**. Blobs:
   - `studio-member-auth.ts` `3facfc23c3b626bae479ea3d7ba40fa1217d1d63`
   - `studio-runtime-store.ts` `078b1b0b3d04bf55a741bfb6c4dba6579da68b28`
   - `studio-transaction-bound-authority-r866.test.mjs` `d4ca6f38f8a85e588fd6a75e3daa0201315ffd19`
   - `studio-atomic-job-brief-r861.test.mjs` `8c19e5bd53bdcb26263dbc0f00d5ae6fc89e6550`
   - `studio-owner-safe-records-r863.test.mjs` `6c1546a0cef2310104c4ddd96cae87575191713a`
5. The new checked-in nine-case repo regression, original complete Studio test suite, Node20/pnpm9.7.0 frozen typecheck/build, real four-service Firebase emulator, deployed IAM and production Rules were **not executed** in this continuation. GitHub clone and npm registry DNS are unavailable in the isolated container.

## Remaining exact acceptance
- Run clean combined R866 source with original Node20/pnpm9.7.0 frozen Studio and Functions builds/tests. Run all earlier R860-R865 synthetic suites. Hash logs, packages and exact checkout.
- Run disposable real Firestore Auth/Functions/Storage emulators with actual Admin transactions: let a draft transaction read all four authority records, revoke membership or start deletion **between its reads and commit**, assert Firestore retry then permission denial and **zero persisted job/brief/export/project bytes**. Test the same with deleted/nonexistent fence creation, role downgrade, permission removal, backend outage and repeated requests. Ensure no transaction read is performed after first mutation.
- For a successful commit followed by lost HTTP response, retries still create duplicate drafts. Actor+tenant+canonical request-digest idempotency remains open.
- `createStudioProject` is still a standalone create-only Admin method, not covered by the three transaction checks; its authenticated caller path and current membership constraints require separate review before server exposure.
- Owner-only GET uses preflight then query, not a transaction; refresh/read delivery races remain unverified. The old `uid`-schema projects and owner export/deletion collection inventory remain unresolved.
- R858/R859 server-owned queue Rules patches are separate unmerged PRs. Jobs #252 privileged GCS post-revoke future-write fence, trusted positive Privacy C6, actual protected private Life Movie from sources→MP4/SRT→owner-only Replay→revocation/deletion and physical-device GO remain **HOLD**.

**Consequence:** R866 closes the obvious source-level preflight/transaction separation for three ordinary Studio draft-write methods, but does **not** certify that Firebase actually enforces the expected concurrent revocation ordering. Do not merge/deploy or promote private-media readiness based on synthetic PASS.
