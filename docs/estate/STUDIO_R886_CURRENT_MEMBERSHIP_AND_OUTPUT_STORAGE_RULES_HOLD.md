# R886 — current-membership and shared-output Storage Rules hardening (HOLD)

**Date:** 2026-11-07. **Base:** R885 Studio draft PR #192 exact head `e85cc27bc462801f0043832f9e294716c2d39c30`. **Branch:** `review/chalk-r886-revoked-membership-storage-output-denial-20261107`. **Classification:** source-level security correction plus changed Firebase emulator fixtures, NOT actual native emulator certification or a production release. All changes isolated in a new review child branch.

## Original flaw and preserved functionality

At R885, `storage.rules` permitted any membership document with role owner, creator or viewer to **read and write** `studios/{studioId}/uploads/**` and `studios/{studioId}/outputs/**`. The membership helper validated role and stored UID/studio but did not test explicit `revoked`, `disabled`, or `active` flags. Equivalent role-only membership matching existed in `firestore.rules`. These omissions could allow an explicitly revoked/disabled role to remain authorized by client Rules and permit viewers to tamper with server-generated shared output objects. No effective deployed Rules revision, actual unauthorized access or user-data incident has been verified. Because original emulator suite expected viewer/output write capability, those compatibility assumptions must change together with the Rules.

## Review-only repair

- `storage.rules` prior blob `06a4520b596038ffd51c941010684e3c30e79931`; **R886 blob `5d5e0e3323388bb653a96a935eca6116f2e7ddad`**. New `currentMembershipState(studioId)` rejects any explicitly revoked, disabled, inactive or malformed boolean membership flag. Legacy documents omitting those optional fields preserve current access. `mayUploadToStudio` allows only valid owner/creator member uploads; viewer is read-only. `studios/{studioId}/outputs/**` retains member reads but has `allow write: if false`; server producers use separately authorized Admin access. Owner-specific `user-uploads`, `generated`, and public-asset paths unchanged.
- `firestore.rules` prior blob `d6a93015ada0ce00ff71c2a63ebb5e1ef1c679e2`; **R886 blob `a26f1b7efa5b93ef2fe66b468770c56a1c0b396d`**. Extends `isStudioMember` with identical optional-flag checks so member-scoped database and media access respond consistently to server-side revocation/disablement. Does not change the separate R858 client-Jobs/audit denial PR, which is a different unmerged worker lane and must be reconciled in a later candidate.
- `security-tests/studio-memberships/membership.test.mjs` prior blob `ebbe9cbcbc3b8354ed2cbccc74018f2cda0f88ea`; **R886 blob `69424e54c1d541076772ff164014923207985885`**. Updates the existing emulator cases to retain valid member read permissions, require owner/creator for shared uploads, reject viewer upload and ALL direct shared-output mutations, and adds six synthetic trusted-seeded invalid membership-state cases (explicit revoked, disabled, inactive and their malformed string counterparts) that must reject document, membership, shared-input and shared-output access. All these cases are checked in, **not executed** here.
- The existing `security-tests/studio-memberships/package.json` still defines `firebase emulators:exec` for Firestore/Storage with prepared emulator rules, but this does not prove a run.

**Intentional limits:** Server-owner asset and source authorization, signed C6 consent and late-Storage-writer fencing remain independent requirements. This patch is not a comprehensive studio membership/entitlement migration. R866 and R867 draft transaction/idempotency work and R885 direct-callable hardening remain unchanged.

## Reproducible readback and evidence tiers

Read 5 complete files at R886 exact review head, with GitHub-returned Git blob identifiers, decoded UTF-8 byte totals of **31,746** (3,723 Storage Rules, 11,637 Firestore Rules, 15,306 emulator tests, 705 test manifest, 375 test Firebase config). **11/11 custom source structural checks PASS**, verifying role/flag controls and test fixture presence. This is no independent SHA-256, no native Firebase compilation and **not 11 executed emulator security tests**.

Actual local host has Node 22.16.0 and Java 21 but lacks Firebase CLI/pnpm and full repository checkout; unauthenticated direct git connection could not resolve github.com. No online dependency installation, cloud operation, billing or production deployment occurred.

## Next exact-run acceptance — required before merge

On an authorized machine with a clean checkout of R886 exact head and disposable emulator ports, run the original Security Tests suite:

```sh
git checkout --detach <EXACT_R886_REVIEW_SHA>
git status --porcelain --untracked-files=all
cd security-tests/studio-memberships
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

Capture actual commit/lock SHA, Node/Java/Firebase CLI versions, all TAP test counts, native Rules compilation failures, effective emulator rules and nonzero exits. No test may silently skip denial, fallback to client-only mocked guards or touch production. Explicitly check a previously accepted viewer/out-of-role upload is denied; unchanged owner/creator input access remains available; no client output create/overwrite/delete; six invalid member states fail both Firestore and Storage; deletion-fence cases remain green. Add production/project publisher readback separately because root `firebase.json` does not configure Firestore or Storage Rules deployment.

## Remaining systemic concerns outside this lane

1. Studio `firestore.rules` still permits any signed-in identity to create `studios/{studioId}` without an authorized server-owned tenant registration protocol (separate issue for owner). Several `clipRequests`, `jobRuns`, `assets`, `outputs`, `deadLetters` still allow client metadata writes for members including viewers. R858 handles `jobs` and `auditLogs` only in another unmerged branch.
2. The older `functions/src/studio-system.ts` exposes 14 callables; R885 hardens only `markAssetReady`. Full owner/member/source/deletion admission and current-role invalidation for other routes is outstanding. No accidental disabling or broad export deletion.
3. In-flight authorized Storage operation after membership revocation, existing external signed GCS URLs, and privileged backend writers are outside the scope of these client Storage Rules.
4. Source project aliases differ across services and have not been reconciled with effective deployed Rules, Functions, Storage, current IAM or integrated Privacy→Jobs→Studio→Replay. Production HOLD.

**Production HOLD. No provider mutation, native pass claim, actual user-media access or paid compute.**
