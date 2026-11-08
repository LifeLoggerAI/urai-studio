# One UrAi Genesis Studio — R856 client job, output and privileged fallback boundary

**Source:** Studio [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179) commit `153d6c35557c66a8b9f8629778ca796b83730464`; observed 2026-11-07. **Classification: directly reviewed source-level permission/control mismatch, not a reproduced exploit in deployed project.** Do not change rules on the docs branch.

## Exact implicated source
| File | Git blob SHA | Fact |
| --- | --- | --- |
| `firestore.rules` | `d6a93015ada0ce00ff71c2a63ebb5e1ef1c679e2` | `isStudioMember` accepts owner/creator/viewer. `/jobs` client create requires only `studioId` and existing membership. `/jobs` update requires membership/same studioId, with no field-level immutable state/priority/project ownership checks. |
| `storage.rules` | `06a4520b596038ffd51c941010684e3c30e79931` | Both `/studios/{studioId}/uploads/**` and `/studios/{studioId}/outputs/**` allow read **and write** to any Studio member, including viewer. Distinct `/generated/{uid}/studio/**` denies client writes. |
| `functions/src/create-job.ts` | `de3519fe24f0994c4ee59f4c8bd86b0afcd3f97d` | Server callable requires StudioUsers role owner/admin/editor and `projects/{projectId}.ownerUid === uid` before writing `jobs`. |
| `functions/src/job-runner.ts` | `78e3a54212eb30eb1cc9752a84a5daa91232da13` | Admin scheduled fallback worker queries `jobs` by state/lease, processes `kind`/`projectId`, writes bucket files to `projects/{projectId}/renders|exports/{jobId}/fallback-*`. No independent checked project owner/Studio membership in `processJob`. |
| `functions/src/on-job-write.ts` | `f5dee92ff456b30c5b0685c2c306bcb229bde192` | Async Firestore trigger reverts unsupported **updates** after write; ignores new/deleted docs, does not prevent unauthorized queued creation, immutable fields or initial admission. |
| `security-tests/studio-memberships/membership.test.mjs` | `ebbe9cbcbc3b8354ed2cbccc74018f2cda0f88ea` | Existing emulator test **intentionally asserts** owner/creator/**viewer** can upload/delete objects under both Studio uploads and outputs. This is legacy compatibility behavior, not a missing assertion. |
| `apps/studio/docs/FIRESTORE_RULES_NOTES.md` | `d22e254e50dc6b2d63420bd8c6cd90a4f6d9b635` | Older design note calls for server-only jobs and viewer+ read but operator+ writes, in tension with current broad rules. Not current authority by itself. |

## Concrete concern and boundaries
A member with a valid `viewer` membership can satisfy the current root Firestore `/jobs` create rule with a member studioId without using the `createJob` callable. The original callable would deny a viewer and independently check `projectId` ownership. The scheduled Admin fallback runner reads that same `jobs` collection, not a separate guaranteed server-owned queue. If the deployed rules/functions match this candidate and the new document meets runner eligibility, it could enqueue a fallback for a caller-nominated project. This is an **authorization-boundary hypothesis grounded in source**, awaiting actual emulator repro and owner-metadata verification. It does **not** assert exploitable deployed production, private Jobs Life Movie success, or a cross-tenant Storage exfiltration; the fallback outputs themselves explicitly carry `fallbackOnly:true,readyForExternalUse:false`.

The broad shared-Studio `/outputs/**` path is **not** the documented canonical protected private Life Movie output prefix under Jobs. Do not equate the two. Nonetheless, no actual owner/rights/consent enforcement in the shared outputs Storage rule makes it inappropriate to use it for protected original media or trusted private Life Movie derivatives.

### Required disposable four-service/emulator test before security repair
1. Seed valid `viewer` membership with an unrelated `projects/{otherProject}` owner. Prove callable `createJob` rejects this actor and then separately attempt direct SDK `setDoc(jobs/...)` carrying a valid member studioId, queued kind and unrelated projectId. Record allow/deny on actual rules and exact SHA.
2. If direct job admitted, invoke original isolated scheduler against disposable Auth/Firestore/Storage/Functions with a finite test lease and mock/synthetic output only. Record whether the Admin worker writes an output outside the viewer's owned project. No production bucket or real private media.
3. Verify the callback trigger cannot preempt initial creation and cannot prevent an allowed field-only or priority edit; no output is entrusted to unverified client metadata.
4. Test viewer/creator/owner create, update, delete under shared outputs with actual `storage.rules`, current data-rights fences and permission revocation. Preserve tenant isolation and valid compatibility requirements.
5. Reconcile intended roles and migrate legacy direct-client workflows **before** tightening rules. Prefer server-authoritative, owner+project-bound queue admission; explicit role restrictions/field immutability; isolate original and generated media from shared writable paths. Run original 42+ membership cases and additional negative cases at the exact combined source, then independent review.
6. Pin exact live deployed Firebase project, rules revision, exported Functions revision, bucket/region and IAM before treating a source hypothesis as a production incident. No project mapping inferred from names.

**No source repair or deployment performed**, to avoid unreviewed breaking changes to the intentionally broad legacy membership compatibility behavior and active parallel engineering branches. This is a P1 security review and possible P0 if deployment/current owner authorization confirms the path.
