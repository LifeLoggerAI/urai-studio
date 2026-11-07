# R885 — legacy Studio callable authorization: privileged asset-ready hardening (HOLD)

**Date:** 2026-11-07. **Source parent:** Studio R866 draft PR #190 `4ded87bb37916924018afc086f49ea59b35c14fa`. **Review branch:** `review/chalk-r885-studio-admin-asset-boundary-20261107`. Documentation and narrowly scoped code correction; **no merge, deployment, production-authorized rule, cloud provider, user-media, or paid compute operations**.

## Forensic problem and exact source

Configured `firebase.json` selects `functions`; `functions/src/index.ts` wildcard-exports `./studio-system`. This module defines 14 onCall functions, including `markAssetReady`, originally gated only by the authenticated caller's signed `admin` token. The call directly merged `status: "ready"`, `publicUrl`, `thumbnailUrl` into an arbitrary `studioAssets/{assetId}` using Admin SDK, without checking a current administrative account, existing target asset/owner, or owner/actor deletion state.

The existing `apps/studio/lib/studio-member-auth.ts` R866 transaction guard covers three newer Next.js draft methods, NOT this direct Functions callable. There is an independent legacy client `apps/studio/lib/studio/firebase-client.ts` that signs in anonymously when needed and invokes legacy callables; indiscriminately removing `./studio-system` would break existing interface calls. Historical demos should remain explicit; this change doesn't authorize private source rendering. No current deployed callable list or IAM was available.

## Narrow patch

`functions/src/studio-system.ts`, previous blob `4ac3c3577aff4514fb3116b08c9c80c6ce238c3b`, R885 blob **`3e6bb2a494736bf1f144a624ea75858c8e9da36a`**:

- Replace signed-claim-only `assertAdmin` with `requireCurrentStudioAdmin`: accepts only a signed admin caller with the actual bearer JWT; re-verifies the token with Firebase Auth revocation checks **before and after** the current Auth-user lookup; requires same UID, enabled user and current `customClaims.admin === true`; errors fail closed. This is not a complete in-transaction Firebase Auth revocation fence.
- `markAssetReady` now validates a bounded asset ID, requires the target `studioAssets` document already exists with a valid `uid`, and invokes one Firestore Admin transaction. It reads actor `studioUsers` and target asset, checks actor current owner/admin role, disabled/revoked/active state, then reads actor and owner `studioDataRightsOwnerFences` and `privacyDeletionTombstones` before a single `transaction.update(assetRef,...)`. Active/malformed/permanent fences and pending deletion lease deny. No implicit creation of nonexistent asset.
- Preserve return shape `{ ok: true, assetId }` and existing legacy callable exports. Do not interpret a ready flag as a private-render grant, storage-rights verification or production approval.

**Limitations:** current role may change outside the Firestore transaction in other systems; bearer can be revoked between final Auth check and transaction commit; no native emulators run to prove cancellation ordering. Existing title, asset URLs and remote provider content may require further safe URL/provenance validation. The other 12 authenticated/admin callables still need current identity/consent/tenant/deletion admission; the standalone `ping` is deliberately unauthenticated. There is **no** proof that any legacy callable is currently deployed.

## Original legacy callable inventory (14)

`ping` (public diagnostic); authenticated: `createStudioProject`, `seedStudioDemo`, `generateStudioScript`, `generateSceneNarration`, `generateSrtForProject`, `generateCompanionIntro`, `createAssetJob`, `createExportJob`, `processExportJob`, `getExportJobStatus`, `getStudioDashboard`, `logStudioEvent`; privileged: `markAssetReady`. All are declared in the same configured source module. The full native/current deployed inventory remains unknown.

## Evidence and verification distinctions

- Exact source readback of modified `functions/src/studio-system.ts`: `3e6bb2a494736bf1f144a624ea75858c8e9da36a`; new checked-in `apps/studio/tests/studio-legacy-admin-asset-boundary-r885.test.mjs`: `0d91ac15e7490ad58e5ffcee4195ffb2cc06de01`.
- Independent connected-GitHub readback: 4 complete source/config files; **10/10 custom literal structural assertions PASS** for token checks, current account claims, transaction role/owner/deletion refs, no implicit creation, ES2020 Object.hasOwnProperty syntax, configured export, test presence and response shape. This is SOURCE-ONLY testing, not the newly committed eight-case Node regression executed on a repository checkout.
- **No full frozen checkout/install**, root Next build, Functions TypeScript compile, checked-in Node test execution, original full Studio suites, auth+Firestore+Functions+Storage native Firebase emulators, IAM inspection, production release or private-media proof. GitHub clone in local container failed DNS resolution; only Node 22 and globally installed TypeScript were observed locally. Existing Studio root explicitly asks Node 20 and pnpm 9.7.0, neither was reproduced here. Do not claim passing CI.
- CI and deployment remain **HOLD**. The Studio `firebase.json` inspected here declares Functions and Hosting but **omits Firestore and Storage rules publishing entries**, even though `firestore.rules` and `storage.rules` exist. This is a source configuration gap requiring explicit publisher/project readback, not proof that any deployed rules are absent.

## Follow-up for Studio owner

1. Run checked-in `studio-legacy-admin-asset-boundary-r885.test.mjs`, full Studio test suite and Functions `tsc -p tsconfig.json` at exact reviewed source using compatible Node 20/pnpm 9.7.0, then pinned emulators. Fix any compiler, Rules or test failures without changing admissions to greenwash results.
2. Test with genuine Firebase synthetic accounts: unsigned, anonymous, stale-admin JWT after current claim removal, revoked token, account disabled, `studioUsers` role downgrade/revoke and deletion fence created during transaction; require zero mutation of target `studioAssets` on denial. Assert nonexistent or foreign asset IDs do not create new documents and retention of owner-known legitimate success.
3. Decide explicit human-approved transition for 12 remaining signed-in legacy callables and public diagnostic: integrate a shared current-caller/tenant/source rights guard, or retire only after confirming clients and deployment. Review Storage upload/read rules and source field integrity. **Do not blindly remove legacy paths**.
4. Reconcile service project, publisher IDs, IAM, Firebase live Functions, current effective Rules, canonical Privacy/Jobs C6 source grants and protected Studio→Jobs→Replay. No private media rendering or downstream deletion ACK until authenticated proof.

Parent Studio R866 and other worker PRs untouched; branch review only. **GENESIS RELEASE HOLD**.
