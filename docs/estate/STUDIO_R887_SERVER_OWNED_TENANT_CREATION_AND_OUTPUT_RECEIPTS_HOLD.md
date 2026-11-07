# R887 — Studio tenant creation and output receipts are server-owned (HOLD)

**Date:** 2026-11-07. **Parent:** R886 draft PR #194 immutable head `ebe038cb056969d3257769488df5a5615af87c89`. **Branch:** `review/chalk-r887-tenant-and-output-metadata-server-authority-20261107`. No deploy, merge, production privileges, provider spend, or private user media.

## Source finding

At parent R886, `firestore.rules` permitted `allow create: if isSignedIn()` under `match /studios/{studioId}`. Arbitrary authenticated clients could therefore create studio identities even without owning a server-issued tenant/membership, although the membership documents themselves remained server-only. The `outputs/{id}` match permitted any current member (including viewer) to create or edit output metadata and an owner to delete it. This undermined R886's Storage-side block on direct client writes to `studios/{studioId}/outputs/**`: an output receipt could be forged while the protected Storage bytes were not modifiable. These are conditional **source rules authorization gaps**, not evidence of deployed exposure or a known exploit.

The Studio browser `apps/studio/lib/studio/firebase-client.ts` already calls server Firebase Functions for project/asset/export operations (including `createStudioProject`), and the configured server `functions/src/studio-system.ts` uses Admin SDK. The legacy client is not shown directly provisioning `studios/{studioId}` or `outputs/{id}`. The existing security emulator tests use trusted disabled-rules setup to seed `studios` and `outputs`, then verify member reads. Do not assume unseen clients have no dependencies.

## Narrow changes

- `firestore.rules`: `studios/{studioId}` `allow create: if false`, while preserving authorized member reads and owner role update/delete. `outputs/{id}` retains member reads and changes to `allow create, update, delete: if false`; server-side writes require explicit authenticated Admin callable restrictions and remain subject to the broader R885/R886 concerns. Prior blob `a26f1b7efa5b93ef2fe66b468770c56a1c0b396d`, R887 blob **`d4fd2d3d2f808636d9938fa0ef3e6cf01b480d01`**.
- `security-tests/studio-memberships/membership.test.mjs`: remove `outputs` from the legacy writable-collection success loop, add negative direct client create tests for owner, creator and outsider attempting a `studios` record, and add three role-specific negative tests for `outputs` create/update/delete with positive read preservation. Parent blob `69424e54c1d541076772ff164014923207985885`, R887 blob **`ecf373eef63a105418d4c47097ad79b945355511`**.
- No change to `storage.rules` (R886 blob **`5d5e0e3323388bb653a96a935eca6116f2e7ddad`**), any other callable, original assets, client bundle, private media or production project.

## Evidence and non-evidence

- GitHub connector exact readback of full files: 4 files, 32,732 decoded UTF-8 bytes (Rules 11,800; tests 16,504; Storage 3,723; test package 705). **12/12 source-structure checks PASS**, including no direct client tenant creation/output mutations, retention of proper reads, test insertion, and unchanged Storage blob.
- These are **not** 12 compiled/emulated authorization checks. No native Firebase Rules compilation, real emulator suite, Studio root frozen install, Functions compile, authenticated callables, production IAM or deployed Rules readback. Container had Node22/Java21 but not pnpm or Firebase CLI; direct GitHub git remote DNS unavailable. Do not infer a clean build.
- The native emulator suite is in `security-tests/studio-memberships`, where `npm test` invokes `firebase emulators:exec` on a disposable demo project; R887 additions must be exercised in that actual runner, not mistaken for a source inspection PASS.

## Reconciliation risks

1. Studio PR #182 (R858) separately denies client `jobs` and `auditLogs` writes. The current R887 branch derives from R886/R885/R866 and DOES NOT include R858. On a combined review candidate, preserve both sets of denials and repair old positive-write emulator assumptions. Do not overwrite current worker changes.
2. Studio PR #193 (R868) is a separate sibling under R867 and should be reconciled with the R885→R886→R887 series against a single exact integration commit after independent review.
3. Current tenant creation is server-authoritative in Rules but the actual tenant provisioning/membership transaction, owner authorization, name uniqueness, billing, quotas and deletion/revocation must be verified. Denying client studio creation could break historical client-only flows; measure and explicitly migrate those rather than weakening Rules.
4. Other client-writable `clipRequests`, `jobRuns`, `assets`, `deadLetters` and additional Studio legacy callable contracts remain a separate security audit. No private Life Movie consent, signed C6, output release or cross-system end-to-end certification is implied.
5. Root `firebase.json` currently declares Hosting and Functions but does not identify effective Rules publisher entries. Exact deployed functions, rulesets, project ID and privileges require provider readback.

## Native acceptance (not run)

With authorized **disposable** emulators and a clean exact R887 review commit: run `cd security-tests/studio-memberships && npm ci --ignore-scripts --no-audit --no-fund && npm test`, preserve complete TAP, process exit, effective Rules byte identities, project ID, and Java/Node/Firebase versions. Require no client creation for studios, no client write/delete for output metadata, valid existing member reads, cross-tenant denial and all R886 revocation, Storage and deletion-fence regressions. Run a separate authenticated server provisioning/owner output test with real Admin SDK and deletion authorization. Do not deploy or issue producer private-media rights without founder approval.

**One UrAi Genesis production HOLD.**
