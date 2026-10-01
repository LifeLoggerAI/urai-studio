# Studio membership authority migration

This runbook moves Studio authorization away from historical flat `memberships/{uid}_{studioId}` records. Those records were once browser-writable, their role fields are untrusted, and underscore concatenation can collide. Canonical authority is now the server-only document `studios/{studioId}/members/{uid}` with `schemaVersion: 2`.

The migration never infers ownership from a legacy role. A real release owner must prepare a private authority manifest from independent ownership evidence. Do not commit that manifest or any migration receipt.

## Required order

1. Verify the exact release SHA and preserve the current Functions and rules versions.
2. Deploy the reviewed callable Functions first. Do not deploy the final rules yet.
3. Export/backup Firestore through the approved project process and record its identifier.
4. Prepare a private manifest that accounts for every legacy membership and every Studio as accepted or rejected.
5. Run `plan`; independently review the counts, manifest hash, inventory hash, and private receipt.
6. Run `apply` only with the exact production project repeated as `--confirm-project`.
7. Immediately set `URAI_STUDIO_MEMBERSHIP_MUTATIONS_FROZEN=true` on the reviewed Functions revision and verify all three membership callables return `unavailable`. Any mutation before the freeze makes the next verification fail closed.
8. Run `verify`, then execute authenticated two-tenant positive and negative staging tests while mutations remain frozen.
9. Deploy Firestore and Storage rules from the same reviewed SHA.
10. Repeat authenticated production isolation smoke, record ruleset/deployment IDs, and retain the receipt privately.
11. Only after the ruleset and isolation proof are recorded, remove the freeze on the same reviewed Functions SHA and verify authorized mutations plus cross-tenant denials again.

Any failure, unexplained record, owner ambiguity, project mismatch, post-plan data change, missing approval, or membership mutation while the release freeze is active stops the release. Never run final verification or activate rules while membership mutations are open.

## Manifest shape

```json
{
  "schemaVersion": 1,
  "projectId": "exact-firebase-project-id",
  "approvedBy": "real-approver-identity",
  "approvedAt": "2026-09-01T00:00:00.000Z",
  "approvalEvidenceRef": "opaque-private-record-reference",
  "entries": [
    {
      "uid": "verified-auth-uid",
      "studioId": "verified-studio-id",
      "role": "owner",
      "status": "active",
      "authorityEvidenceRef": "opaque-private-authority-reference",
      "legacyDocumentIds": ["exact-legacy-document-id"]
    }
  ],
  "rejectedCanonicalMemberships": [],
  "rejectedLegacyMemberships": [
    {
      "documentId": "untrusted-legacy-id",
      "reason": "Meaningful private-safe rejection reason.",
      "authorityEvidenceRef": "opaque-private-rejection-reference"
    }
  ],
  "rejectedStudios": []
}
```

Each accepted Studio must have exactly one active owner. Every legacy membership, canonical membership, and Studio in the live inventory must be explicitly accepted or rejected. Rejected canonical memberships are deleted atomically, and accepted Studio documents are normalized with immutable `studioId` and `createdBy` fields before the final rules are deployed.

## Commands

Run from `functions/` with Node 20 and Application Default Credentials for the intended project:

```bash
node scripts/studio-membership-migration.mjs plan \
  --project exact-firebase-project-id \
  --manifest /private/path/authority-manifest.json \
  --receipt /private/path/migration-receipt.json

node scripts/studio-membership-migration.mjs apply \
  --confirm-project exact-firebase-project-id \
  --manifest /private/path/authority-manifest.json \
  --receipt /private/path/migration-receipt.json

node scripts/studio-membership-migration.mjs verify \
  --confirm-project exact-firebase-project-id \
  --receipt /private/path/migration-receipt.json
```

The tool caps an atomic migration at 400 accepted memberships. It creates private receipts with mode `0600`, checks every preimage before applying, and stores only hashes/counts/approval references in the server-side migration marker.

## Rollback

Rollback is allowed only before any canonical membership has changed after migration. It compares every current document with the recorded post-migration hash and stops on any mismatch.

```bash
node scripts/studio-membership-migration.mjs rollback \
  --confirm-project exact-firebase-project-id \
  --receipt /private/path/migration-receipt.json \
  --approved-by real-rollback-approver \
  --approval-evidence-ref opaque-private-rollback-reference
```

Rolling back canonical data does not make the historical browser-writable rules safe. Prefer a forward repair or a reviewed prior canonical ruleset. Never restore rules that allow client membership writes.
