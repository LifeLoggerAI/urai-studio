# ADR-005: Server-authorized Studio membership and RBAC

Date: 2026-07-06  
Status: accepted for V50 source hardening; emulator and migration proof pending

## Context

The previous Firestore rules allowed any signed-in browser client to create a Studio and create or update a membership document named `<uid>_<studioId>`. Because the role field was client supplied, a user could self-assign an `owner` membership for an arbitrary Studio identifier. Storage trusted the same unqualified membership existence check.

That model conflicts with the canonical architecture requirement that tenant membership and role transitions are server controlled and enforced consistently across APIs, callables, Firestore and Storage.

## Decision

1. Firebase Authentication establishes identity but does not grant Studio membership.
2. The canonical membership document remains `memberships/{uid}_{studioId}` during V50 migration and must contain:
   - `uid` equal to the member identity;
   - `studioId` equal to the tenant identifier;
   - `role` in `owner`, `admin`, `editor`, `reviewer`, `viewer`;
   - `status` equal to `active`, `suspended` or `revoked`;
   - server timestamps and actor/audit fields in the application schema.
3. Only trusted server code using Firebase Admin may create Studios, grant membership, change roles, suspend/revoke membership, or delete membership.
4. Browser clients may read their own membership. Active owners/admins may read membership records for their Studio where required by an approved UI.
5. Browser writes are role bounded:
   - owner/admin/editor may create or update editable Studio records;
   - tenant identifiers are immutable on update;
   - owner/admin may delete governed records;
   - worker lifecycle, outputs, dead letters and audit logs are server owned.
6. Storage uses the same active membership and edit-role checks. Generated outputs are server written.
7. Legacy uid-owned collections remain isolated under their existing rules until ADR-006 defines migration and retirement. They do not grant canonical tenant roles.

## Security properties

- A signed-in user cannot create an owner membership.
- A member cannot change a record's `studioId` to write across tenants.
- Suspended or revoked membership does not authorize Firestore or Storage access.
- Viewer/reviewer roles cannot upload or mutate editable records.
- Browser clients cannot impersonate workers or write audit evidence.
- Firebase Admin operations remain responsible for validation, authorization, idempotency and audit records.

## Required trusted operations

Before production use, server routes/callables must implement and test:

- create Studio plus initial owner membership atomically;
- invite or grant membership using a verified actor with owner/admin authority;
- role transition with last-owner protection;
- suspension, revocation and reactivation;
- invitation expiry and replay prevention;
- membership audit event;
- tenant-scoped listing without leaking other Studios;
- deletion/retention consequences.

## Migration

Existing memberships without `status: "active"` will no longer authorize access under the hardened rules. Before deploying rules, run an owner-approved migration that:

1. inventories membership documents and duplicate IDs;
2. verifies `uid`, `studioId` and role against authoritative ownership evidence;
3. adds `status`, schema version, timestamps and actor/source;
4. rejects or quarantines ambiguous memberships;
5. records counts and checksums in the release receipt;
6. validates two-tenant positive and negative cases in the emulators;
7. deploys server operations before client rule enforcement;
8. preserves a rules rollback version and migration rollback plan.

No migration should infer ownership from a client-supplied role alone.

## Verification gate

Source guards in `apps/studio/tests/studio-membership-rules.test.mjs` prevent reintroducing self-service membership or client-owned worker state. They are necessary but not sufficient.

Issue #52 remains open until Firebase Emulator Suite tests prove:

- unauthenticated denial;
- self-membership creation denial;
- cross-tenant read/write denial;
- active viewer read and write denial;
- active editor allowed editable writes;
- studioId mutation denial;
- suspended/revoked denial;
- owner/admin membership visibility;
- browser worker/output/audit write denial;
- Storage upload/output matrix;
- server-authorized lifecycle integration.

## Consequences

This is a fail-closed change and may block current clients whose memberships are missing status or whose Studio creation path writes directly from the browser. That is intentional until the trusted lifecycle and migration are implemented. The rules must not be deployed independently of the migration, server operations, exact-SHA release checks and rollback receipt.
