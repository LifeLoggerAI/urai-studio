# R888 — reconciled Studio worker-record authority and native test handoff (HOLD)

**Date:** 2026-11-07 CST. **Exact parent:** Studio R887 PR #195 `1bb2c46d50d64027977ffacf42c41bb393ffed6f`. **Branch:** `review/chalk-r888-unified-server-owned-worker-records-20261107`. **Scope:** source-level reconciliation of independently reviewed worker and membership Rules; no deployment, merge, paid compute, protected media or provider operations.

## Inputs and authority preserved

- **R858 / Studio PR #182:** `c0df95eaef976c10b4f5b611060f83ac1c4e035a` — server-only `jobs` and `auditLogs` Firestore writes, member reads, seven negative/continuity emulator tests.
- **R859 / Studio PR #183:** `c0f21ff57ad2f6b3525f1f756df6ae7126c4dfc4` — adds server-only `jobRuns` and `deadLetters` while retaining R858, including seven more emulator tests.
- **R885 / PR #192:** `e85cc27bc462801f0043832f9e294716c2d39c30` — current-Auth/current-actor privileged asset-ready guard; only one callable hardened.
- **R886 / PR #194:** `ebe038cb056969d3257769488df5a5615af87c89` — revoked/disabled/inactive membership in Firestore/Storage; owner/creator tenant uploads, no direct shared output byte writes, authenticated valid member reads.
- **R887 / PR #195:** `1bb2c46d50d64027977ffacf42c41bb393ffed6f` — server-only `studios` creation and `outputs` receipt mutations, retained member reads.

R858–R859 were developed on a different sibling lineage from R885–R887. This branch deliberately **does not merge, squash, cherry-pick blindly, or rebase** those review branches. It manually transplants the exact proven *behavioral changes* and their distinct existing test cases onto R887, retaining each original evidence source and the parent R887 implementation.

## Exact reconciled correction

`firestore.rules` old R887 blob `d4fd2d3d2f808636d9938fa0ef3e6cf01b480d01` → R888 blob **`59646048a0e3c24517aa753c1f0962ae3f9eace7`**:

- Existing member reads retained for `jobs`, `jobRuns`, `deadLetters`, `auditLogs` and R887 `outputs`.
- Every direct **client create, update, delete is now false** for those five record collections; only the trusted server/Admin path may create or amend operational, audit, worker, retry and output metadata.
- Retains R886 optional flagged-membership denial and R887 `studios` create deny. Other client-writable collections `clipRequests` and `assets` are **not touched**.

`security-tests/studio-memberships/membership.test.mjs` old R887 blob `ecf373eef63a105418d4c47097ad79b945355511` → R888 blob **`d4e2cb608c29902edab2511e6763fc462a072177`**:

- Removes `jobs`, `jobRuns`, `deadLetters` from the surviving positive mutable-collection loop (only `clipRequests`, `assets` retained).
- Carries original R858 signed-in three-role job denial + forged audit author denial + trusted-server read tests, and R859 jobRuns/deadLetters three-role denial + tenant read/outsider denial tests, without rewriting their assertions.
- Keeps R886 six invalid membership state denial fixtures and R887 three-role output forgery and tenant-provisioning negatives.
- Native emulator test code was updated, **not executed**, so neither full suite compatibility nor native Rules syntax is certified.

Unchanged source by independent exact readback: `storage.rules` blob **`5d5e0e3323388bb653a96a935eca6116f2e7ddad`**, `functions/src/studio-system.ts` blob **`3e6bb2a494736bf1f144a624ea75858c8e9da36a`**. No replacement of the newer Studio draft transaction/idempotency stack.

## Verification tier and reproducibility

GitHub connector exact readback of five full files: **53,917 decoded UTF-8 bytes** (Rules 11,596; membership emulator suite 19,201; Storage 3,723; Functions Studio module 18,692; test package 705). **20/20 source-pattern assertions PASS:** five member reads/five write denials; server-owned Studio creation; flagged membership; original R858/R859 cases retained; R886/R887 negatives retained; remaining positive fixtures correct; Storage/Function blobs unchanged and emulator runner present. GitHub-returned Git blob IDs listed above; **no independent file SHA-256 recomputation, real TAP execution or emulator rule compilation**. A local environment check found Node 22.16.0, Java 21 and git, but no pnpm or Firebase CLI, and DNS failed for github.com and npm registry. No exact checkout/SDK was available to run full-native tests.

**Actual required next command sequence** (authorized disposable host, no production):

```sh
git checkout --detach <EXACT_R888_REVIEW_HEAD>
test -z "$(git status --porcelain --untracked-files=all)"
cd security-tests/studio-memberships
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

Preserve exact commit SHA, installed dependency/lock SHA, Rules SHA-256, Node/Java/Firebase versions, full TAP, failures, skipped tests, and exit codes. Require all member-positive, original R858/R859 negative, R886 Storage revocation and R887 tenant/output tests. Test with actual Firestore+Storage emulators and separate authenticated server writers/denial, not strings or mock-only success. Build and test Next app/Functions under Node20/pnpm9.7.0 on same selected source and separately run full real-four-emulator Private C6 owner → Studio → Jobs → owner Replay flow.

## Unresolved critical release gates

1. **Rules publication source gap:** Studio root `firebase.json` inspected at R885 has Hosting/Functions but does not configure Firestore/Storage deployment. Effective deployed rule revisions and publisher service accounts remain UNKNOWN; no claim that review branch is installed.
2. **Other worker stack:** R868 PR #193 and R869 PR #196 extend draft/export idempotency on the **R866→R867→R868** sibling chain. They edit different runtime store/test paths; reconcile their exact heads and run one frozen native combined acceptance. Do not overwrite them.
3. **Legacy callables:** only one of 14 R885 legacy Studio callable exports is hardened; remaining signed-in direct paths need positive rights, current account, deletion and source generation checks before exposure.
4. **Other client mutable collections:** `clipRequests` and `assets` can still be changed by authorized members, including viewers; this needs a separate compatibility and integrity review before changing behavior.
5. **Production P0:** Jobs signed C6/Privacy consent, post-revocation privileged GCS late-write fence, original private-source render to MP4/SRT and owner-only Replay, authentic deletion/revocation, browser and physical-device experience, protected CI/IAM approval remain HOLD.
6. **Provider and account:** GitHub tool access is not interactive account 2FA restoration and not production GO. Avoid paid capacity or account changes without explicit owner authorization.

**No release approval, no emulators executed, no deployed rules modified. One UrAi Genesis HOLD.**
