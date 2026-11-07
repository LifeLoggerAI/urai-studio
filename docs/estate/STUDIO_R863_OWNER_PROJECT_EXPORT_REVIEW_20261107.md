# One UrAi Genesis — Studio R863 standalone owner-bound project, brief and export review

**2026-11-07. REVIEW-ONLY / NOT MERGED / PRODUCTION HOLD.** Parent source: Studio R862 #186 `eadab9fc521520496702d451f9cdc60db92d49d0`, descending from R861/R860 and movie candidate #179 `153d6c35557c66a8b9f8629778ca796b83730464`.

## New security findings confirmed from source
1. Modern `createStudioProject` formerly used `doc(project.id).set(project, {merge:true})` with caller-selectable ID; callers could overwrite an existing project record under that ID without checking its owner.
2. Modern standalone `createStudioBrief` formerly wrote a brief referencing any `projectId` with no verified tenant/owner/project record.
3. Modern `createStudioExport` formerly wrote `studioExports` from caller-selected project/job/asset references without binding them to an existing owner, tenant or project. Outputs were already `draft` with no download URL, so this is a metadata/source-provenance boundary rather than a verified private video leak.
4. **Schema conflict:** existing `functions/src/studio-system.ts` `createStudioProject` and `seedStudioDemo` use historical `uid`, `title`, `exportStatus` records, whereas modern `StudioProject` requires `tenantId`, `userId`, `name`, `ownerSystem`. R862's and R863's exact owner checks will not recognize old `uid`-only records. Do not silently reinterpret `uid` or infer tenancy from mutable request headers; audited migration and dual-schema compatibility tests required.

## Isolated proposed repair
- Modern `createStudioProject`: validate document ID `[A-Za-z0-9_-]{1,160}` and use `doc.create(project)` rather than a merge-upsert, so an existing caller-chosen ID fails without changing it.
- Modern `createStudioBrief`: validate project and brief IDs; in one Admin Firestore transaction, read `studioProjects/{id}`, demand exact `tenantId` and `userId`, then `transaction.create(studioBriefs/...)`. Missing/foreign reference returns uniform `studio_reference_unavailable`; never disclose the other owner's metadata.
- Modern `createStudioExport`: validate project/job/asset refs; prohibit duplicate asset IDs and more than 25; read project plus any referenced job/assets inside one transaction; require all exact `tenantId`, `userId`, `projectId`; only then create `studioExports` as `draft` with `downloadUrl:undefined`. Uniform reference denial, no generation enabled.
- No direct changes to customer media, Firestore Security Rules, Firebase IAM, old historical Callable `studio-system.ts`, Jobs worker, Privacy C6, or actual movie rendering.

## Evidence level
- Exact GitHub readback `apps/studio/lib/studio-runtime-store.ts` blob `7f3dfdd21953eb6db9f11eaaf9361f62e5257d16`, `apps/studio/tests/studio-owner-safe-records-r863.test.mjs` blob `3e2fa8d28d8fd4084e541ed04a43b9003fd9fd12`, schema contract blob `1cc2ee4327767b58e4cdefb7265bd1b7b4205181`.
- **24/24 connected-GitHub source invariants PASS** (create-only, scope, transactions, bounded references, draft/no URL, regression declarations). Classification: **source assertions only**, not native test execution or environment certification.
- New checked-in `.test.mjs` has **13** synthetic transaction scenarios for project ID collision/invalid ID, standalone brief authorized/foreign/failure, export authorized/foreign/wrong job/wrong assets/duplicate/too many/transaction rollback. Auto-discovery by `apps/studio/tests/all.test.mjs` expected. **13 cases NOT YET RUN**; no 13/13 PASS claim.
- Local host Node22/TypeScript available, but no full GitHub checkout due blocked GitHub/npm DNS, no frozen pnpm install or Firebase SDK. Native Studio test/typecheck/build and real Firebase emulators NOT RUN. No production writes, provider spend, private media or deployments.

## Remaining review and native acceptance
1. Check production auth `apps/studio/lib/studio-auth.ts`: `requireStudioAuth` derives tenant from verified token claim when present but otherwise falls back to caller `x-urai-tenant-id`; this is not itself a trusted membership grant. Verify immutable tenant authority/authorization on each write before enabling deployment.
2. Original `functions/src/studio-system.ts` callable creates historical `uid` projects, `exportJobs` and `studioEvents`, not the modern Next.js contract. Require a versioned, audited migration with original-owner proof; do not loosen checks merely to make old records pass.
3. Standalone `createStudioProject` is not a directly authenticated Next.js route in the reviewed candidate (a QA panel uses the historical Firebase Callable). The modern store nevertheless should not be a privileged arbitrary-ID upsert. Verify actual deployed callers and compatibility before merging.
4. Run Node20/pnpm9.7.0 `pnpm --filter studio test`, `typecheck`, `build`, `pnpm --dir functions build`, plus four Firebase disposable emulators; require recorded actual owner/other owner/missing refs, race, and no outputs.
5. Retry idempotency remains OPEN: successful commit/lost response can produce duplicates. Old schemas, full owner export/deletion across `jobs`/`jobRuns`/`deadLetters`/`studioJobs`, stacked R858/R859 Rules, Jobs #252 privileged Storage write fence and signed Privacy C6 positive Life Movie grant still HOLD.

**Do not merge or deploy as proof of private movie authorization.**
