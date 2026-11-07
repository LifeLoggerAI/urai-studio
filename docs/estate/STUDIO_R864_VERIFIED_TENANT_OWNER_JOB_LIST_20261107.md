# One UrAi Genesis — Studio R864 verified tenant and owner-scoped job reads

**Date:** 2026-11-07. **Review-only engineering branch; no merge, deploy, paid compute or private customer media. Production HOLD.**

**Parent:** R863 Studio [PR #187](https://github.com/LifeLoggerAI/urai-studio/pull/187), exact `d7081d58a14ff71dfdbd4f3d811f2abe49946573`. Underlying movie candidate [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179) `153d6c35557c66a8b9f8629778ca796b83730464`.

## Source findings and minimal repair
1. `apps/studio/lib/studio-auth.ts`: the previous production token branch called `verifyIdToken(token)` without revocation checking and could use the untrusted `x-urai-tenant-id` header when signed `tenantId` and `studioId` were missing. This granted a caller-chosen tenant label to an otherwise verified uid. R864 requires an unambiguous signed tenant claim (`tenantId` or `studioId`), rejects conflicts or malformed tenant/uid, and invokes `verifyIdToken(token, true)` for revoked-token checking. Header identity is preserved **only for no-token local nonproduction development**.
2. `apps/studio/lib/studio-runtime-store.ts` / `apps/studio/app/api/studio/jobs/route.ts`: list previously queried only `studioJobs.tenantId`; a member could receive other users' job metadata within the same tenant if that tenant is shared. R864 requires both `tenantId` AND `userId` in the Firestore query and passes `auth.uid` from the verified identity.
3. `firestore.indexes.json`: adds precise `studioJobs` composite `tenantId ASC, userId ASC, createdAt DESC`. The index needs actual Firebase validation and deployment before the query can work reliably in production.
4. Adds `apps/studio/tests/studio-auth-owner-r864.test.mjs`, an 11-case source-function and query invariant test, using the actual checked-in auth TypeScript transpiled under Node. It covers signed tenant, hostile header, missing/conflicting/malformed claims, revoked token, missing production token, local development, legacy signed `studioId`, unavailable Admin Auth and owner query/index.

## Exact GitHub source blobs
| File | Git blob SHA |
| --- | --- |
| `apps/studio/lib/studio-auth.ts` | `2340eb147ad2ada99c1c64229f0aeb170b3ef752` |
| `apps/studio/lib/studio-runtime-store.ts` | `a5bc30e4786eaf9afe67ccd3b4950a504a41ba30` |
| `apps/studio/app/api/studio/jobs/route.ts` | `183fe5525cba675c42cd3f2254428b5febfc3e9a` |
| `firestore.indexes.json` | `adb22e87b60896fe24bd882501f9c61cc12ab084` |
| `apps/studio/tests/studio-auth-owner-r864.test.mjs` | `f7bb2aab2602ee7a5d779335cc383603aa6bde6c` |

## Direct execution and test-evidence categories
- Exact local source file `studio-auth.ts` was constructed and **Git blob verified** against the connected GitHub result: `2340eb147ad2ada99c1c64229f0aeb170b3ef752`, 3,741 bytes, raw SHA256 `bd1fc9e5bac09f88fc78dcab3f9c3bd45a951d7fc333aff0fd4b3b72f752167c`.
- Native Node 22.16.0 + TypeScript 5.8.3 `transpileModule` and `node --test` against an in-memory simulated Firebase verifier: **9/9 PASS** (original local TAP SHA256 `62f87e896aeed84d5eca10a527bb07fd7eb8bd8f4557fbd0f15cab4260c63c93`, runner SHA256 `89db7a0d4293cb5fa7b391d8442e2c60561a3919b8bf59fd983fc29681137dc2`). This executes actual source behavior, NOT real Firebase Auth or deployed tenant membership.
- Connected GitHub direct readback static source comparisons: **12/12 PASS** across auth, owner query, route, index, test discovery, hard-off.
- New committed 11-case repository suite is **NOT** claimed to have been executed; its first 9 scenarios overlap locally executed synthetic verifier cases, plus unavailable-admin/query assertions. Full original Studio/Functions build, real Firebase Admin/Rules emulators, Firebase project index installation, physical device, production and private rendering are not verified.

## Still-open authorization and compatibility gates
- This does **not verify tenant membership or user role** using server-provisioned `memberships/{uid}_{tenantId}` and `studioUsers/{uid}`. A signed tenant claim alone is a claimed association, not necessarily currently active membership. Verify current role/membership, deletion/revocation fences and fresh user rights before sensitive workflows or enabling private media; do not equate this ordinary Studio API to `requireStudioLongformAuth` which separately checks membership and fences.
- Because a query formerly returned all jobs within one tenant, some clients may rely on shared jobs; assess explicit permissions and migration before merge.
- Firestore composite index must be tested in emulator and production-relevant configuration. Auth token revocation checks may add latency and must be measured.
- Explicitly **not solved**: request idempotency after committed draft+lost HTTP response, owner validation across legacy `uid` project records, separate R858/R859 Firebase Rules, Jobs #252 storage-level future-write fence, positive Privacy C6, genuine protected MP4/SRT, Replay and deletion.
- Original system source frozen tests must run at exact merged commit with Node20/pnpm9.7.0, disposable Firebase Auth+Firestore+Storage+Functions, signed test identities, tenant membership/permission changes and failure concurrency. Produce run logs and independent reviewer authorization before deployment.

**No change to original Jobs/Privacy/Spatial source or paid infrastructure. One UrAi Genesis production HOLD.**
