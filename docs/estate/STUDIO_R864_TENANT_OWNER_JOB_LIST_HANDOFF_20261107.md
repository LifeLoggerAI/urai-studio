# One UrAi Genesis — Studio R864 tenant authorization and owner-only job listing

**2026-11-07 UTC. Review-only; production HOLD.** Engineering [Studio #188](https://github.com/LifeLoggerAI/urai-studio/pull/188) is a separate stacked draft on R863 #187, not merged/deployed. Head `511ab24e1dfc88e4d8323988fd807b1aa9c66c1d`.

## Source-pinned new findings
- `requireStudioAuth()` previously used caller-supplied `x-urai-tenant-id` when verified Firebase token contained neither `tenantId` nor `studioId`, and called `verifyIdToken(token)` without explicit revocation check. R864 now requires an unambiguous signed tenant claim, rejects conflicting/malformed claims, and calls `verifyIdToken(token, true)`. Development-only no-token header fallback remains explicit and separate.
- `listTenantJobs` previously queried `studioJobs` by tenant only, potentially including other users' drafts in that tenant. R864 queries `tenantId` AND `userId`, and the authenticated REST route passes both current `auth.tenantId` and `auth.uid`. Adds a composite index `studioJobs(tenantId ASC, userId ASC, createdAt DESC)` that still needs native Firebase index acceptance.
- Source blobs: `studio-auth.ts` `2340eb147ad2ada99c1c64229f0aeb170b3ef752`; `studio-runtime-store.ts` `a5bc30e4786eaf9afe67ccd3b4950a504a41ba30`; Jobs route `183fe5525cba675c42cd3f2254428b5febfc3e9a`; `firestore.indexes.json` `adb22e87b60896fe24bd882501f9c61cc12ab084`; checked-in `studio-auth-owner-r864.test.mjs` `f7bb2aab2602ee7a5d779335cc383603aa6bde6c`.
- Executed exact Git-blob-matched Auth TS function locally with Node22+TS5.8.3 against synthetic Firebase Admin verifier: **9/9 PASS**. TAP SHA256 `62f87e896aeed84d5eca10a527bb07fd7eb8bd8f4557fbd0f15cab4260c63c93`, matched raw TypeScript source SHA256 `bd1fc9e5bac09f88fc78dcab3f9c3bd45a951d7fc333aff0fd4b3b72f752167c`. **12/12 GitHub source assertions** for query and index. The newly committed 11-case repository test has NOT run in the full checkout; no native Firebase emulator, CI, build, or production claims.
- Complete R864 engineering report: `docs/estate/STUDIO_R864_VERIFIED_TENANT_OWNER_JOB_LIST_20261107.md` in #188.

## Release blockers and next exact validation
- **Signed tenant claim does not equal currently active membership.** Unlike the private longform auth helper, the ordinary Studio auth helper still does not verify current `studioUsers` role and `memberships` state, revocation/deletion fence or project-specific authorization across all endpoints. Do not promote this ordinary token claim to trusted Privacy C6/movie execution.
- Existing clients may expect shared tenant job listings; review and migrate explicitly rather than weakening individual owner isolation. New Firestore composite index must be validated under clean Firebase emulator and deployed permissions.
- Next issue is tenant+user+canonical-request-digest-bound idempotency for Studio draft creates; lost HTTP receipt after commit can create duplicate new IDs. This remains open.
- Legacy `uid`-only projects still do not automatically match modern owner/tenant schema; R858/R859 Rules PRs remain unmerged; Jobs #252 privileged post-revocation Storage fence and signed positive Privacy C6 remain hard-off; actual private movie rendering/owner Replay/deletion not certified.

**No private media, billing, IAM, deployed Firestore rules, production state or other workers' branches changed. HOLD.**
