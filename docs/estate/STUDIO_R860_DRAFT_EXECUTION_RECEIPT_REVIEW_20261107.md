# One UrAi Genesis Studio — R860 truthful draft execution receipts

**Source parent:** Studio movie candidate PR #179 `153d6c35557c66a8b9f8629778ca796b83730464`. **Change scope:** isolated, unmerged R860 branch. **Production HOLD / no private positive C6 grant.** This is independent of stacked R858/R859 Firebase Rules drafts. No deployments, secrets, production IAM or paid compute.

## What actual source shows
- The current Next.js `/api/studio/jobs` and `/api/studio/video-factory` write `studioJobs` through `createStudioJob`; `/api/studio/exports` writes `studioExports`. The store labels provider `feature-gated` and model `contract-only`, writes no actual generated media, and exports have `downloadUrl: undefined`.
- An old `functions/index.ts` (blob `4cab99cdebb6b4f8b7192d14e20dbaa3c70d722d`) creates a dummy `studioOutputs` result and marks `studioJobs` complete, **but is not built** by the configured `functions/tsconfig.json` (includes only `src`); package main `lib/index.js` comes from `functions/src/index.ts`. It would be incorrect to wire the fake worker into release.
- Separate governed private `jobs-dispatch` route targets external Jobs, and its positive authorization remains hard-off. This R860 Studio job/store path must not claim a Life Movie.
- Original June 30 release blockers already require that incomplete generation/export features stay clearly labeled non-production.

## Narrow isolated repair
1. `apps/studio/lib/studio-runtime-store.ts` adds immutable `STUDIO_CONTRACT_EXECUTION` with `mode:'contract-only'` and explicit **false** `workerDispatched`, `outputVerified`, `mediaRendered`, `privateRenderConsentAuthorized`. It changes newly created provider-gated `studioJobs` and `studioExports` records from `queued` to **`draft`**, a valid existing `StudioJobStatus`. The changes do not rewrite old documents.
2. Three authenticated POST routes `/api/studio/jobs`, `/api/studio/video-factory`, `/api/studio/exports` return HTTP 202, `persisted:true`, `status:'draft'`, and the explicit no-execution receipt. Unconfigured runtime continues its existing fail-closed production response.
3. `QueueReplayTeaserButton` validates both draft state and the entire explicit hard-off receipt. A missing or contradictory receipt cannot display a successful render/queue result. The page and button describe a saved storyboard draft, not a produced MP4.
4. Adds `apps/studio/tests/studio-contract-only-receipts-r860.test.mjs` (automatically discovered by existing `apps/studio/tests/all.test.mjs`). This test covers five surfaces, receipt false values, draft state, UI refusal, historic dummy worker exclusion, and independent Life Movie transport.

## Verification ledger
- Source-read blobs at isolated branch: `studio-runtime-store.ts` `46b7b494514982f97d830f4f059543ecbac1308a`; jobs route `aec7f27eb761cc7f2d65deac36cef1787810596e`; video route `253af666f5c2a54742cc396e1baf546c141834d2`; exports route `54e20125348af0fb686163d7030e1510daf6f871`; UI `d43c15dc66e5ed6ca25dd363fa475959a24145b2`; page `1d97d79b041b05b718b4ab92c9daa5604a21c21b`; new test `f4fda5e64cd0b0088f2902170b729d8edb6a0654`.
- **15/15 GitHub source-consistency assertions PASS**, including agreement on unexecuted draft state, honest API/UI and unchanged deployed Functions entrypoint. **NOT original native suite, not TypeScript build, not emulator, not actual rendered film.**
- Local host Node 22.16.0 and Java 21 present; no pnpm, Firebase test SDK or original source checkout, DNS for npm/GitHub unavailable. This work intentionally avoids provider activations and new costs.

## Required next native acceptance
1. Detached exact SHA checkout, Node 20/pnpm 9.7.0, frozen install; run original `pnpm --filter studio test`, `typecheck`, `build` and `pnpm --dir functions build`. Preserve stdout/stderr digests and code SHA.
2. Confirm authenticated real Firebase Admin writes new `draft` records, returns the exact 202 receipt, keeps tenant reads isolated and gives no output URL. Test unconfigured and revoked-owner responses; ensure legacy queued records aren't silently reclassified.
3. Independently review API compatibility: clients expecting `queued` will need a measured migration. The saved draft state is **not worker admission** and cannot become `queued` without explicit validated consent, source rights, worker/lease and output authority.
4. Evaluate atomicity: `createStudioJob` writes a job before a separately created prompt brief; a failure between them can produce a persisted draft with an incomplete API receipt. Need idempotent transaction/batch or rollback to prevent duplicate drafts on retry.
5. Follow R858/R859 native Rules fixes separately; reconcile `studioJobs` vs `jobs` processing, history and data rights; keep Jobs #252 durable post-revocation Storage fence, trusted C6 issuer and owner-only Replay hard-off until authenticated acceptance.

**Do not merge on the strength of source assertions. Do not use sample/dummy media as positive private Life Movie evidence.**
