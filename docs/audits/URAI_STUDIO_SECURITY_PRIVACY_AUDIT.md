# URAI Studio Security and Privacy Audit

Audit target: `main@4a1ce1bf39c821212f5b7565453761d85aad545c`  
Date: 2026-07-06

## Security posture summary

The repository contains meaningful controls: Firebase token verification for production Studio APIs, uid/tenant fields in runtime documents, deny-by-default rules for server-only collections and public intake data, owner/admin callable checks, strict legacy job payload validation, baseline security headers, and explicit no-secret smoke checks.

The system is not ready for a production security sign-off because authorization models overlap and the Firestore membership rules allow unsafe self-service role creation.

## Critical findings

### SEC-001 — Firestore membership self-enrollment and role escalation (P0)

`firestore.rules` allows any signed-in user to create a membership document and to update/delete a membership whose document ID starts with their uid. The rules do not require an invitation, existing owner approval, a trusted server path, or a constrained role value. `isStudioMember` and `roleIs` then trust that document.

Impact: a signed-in user may be able to create a membership for an existing studio and choose a privileged role, gaining read/write or owner-style authority over studio-scoped collections and Storage paths.

Required remediation:

1. Define a canonical membership schema (`uid`, `studioId`, `role`, invitation/issuer metadata).
2. Permit membership creation only through a trusted server action or a verifiable invitation accepted by the matching uid.
3. Permit role changes only by an existing owner/admin under explicit transition rules.
4. Prevent a user from editing their own role.
5. Add Firestore and Storage emulator tests for cross-studio reads/writes, forged membership IDs, forged roles, owner takeover, and revoked membership.

### SEC-002 — Caller-influenced production tenant scope (P0, fixed on branch)

Before this audit branch, `requireStudioAuth` could use `x-urai-tenant-id` as the fallback when a valid Firebase token lacked a tenant/studio claim. The audit branch now falls back to the verified `decoded.uid`, preserving request headers only for non-production local fallback.

Required merge evidence: Studio regression tests, production API smoke, and a test using two identities showing that one cannot list or create data in the other's tenant.

### SEC-003 — Current release has no authorization proof (P0)

No current-head emulator or production evidence proves Firestore rules, Storage rules, custom claims, API tenant filters, callable ownership, and admin paths as one end-to-end authorization system.

## High-risk findings

- Multiple authorization models coexist: `studioId` membership rules, uid-owned legacy documents, server-only runtime collections, Firebase custom claims, and API-derived tenant IDs.
- `markAssetReady` requires an `admin` custom claim, while other legacy operations use Firestore user roles. Role-source precedence is not canonical.
- Public integration and system-contract endpoints intentionally expose environment variable names. Values are not intended to be exposed; smoke tests should continue scanning non-contract endpoints.
- Invalid Firebase token errors return the underlying error message. Normalize production client messages and keep detailed verification errors in structured server logs.
- CSP is report-only and permits unsafe inline/eval. Move to nonce/hash-based enforcement after collecting reports and validating Next.js/Firebase behavior.
- The scheduled runner stores error stacks in Firestore job documents. Sanitize or restrict stack visibility because provider paths, internal identifiers, or request details may be sensitive.
- Audit logging records IP and user-agent in `createJob`. A retention period, access policy, and privacy disclosure are required.

## Privacy and data-rights findings

Confirmed controls:

- Public form collections are denied to direct client access.
- Runtime server-only collections are denied to direct client SDK access.
- User-owned generated paths are read-scoped to the user.
- The product contains privacy routes and consent contract types.

Missing production controls:

- No complete data inventory/classification by collection and Storage prefix.
- No proven consent receipt lifecycle bound to generated assets and exports.
- No end-user export of all personal data.
- No verified deletion workflow covering Firestore, Storage, derived artifacts, logs, provider copies, and backups.
- No documented retention schedule or legal-hold process.
- No proven account recovery/revocation/session invalidation flow.
- No data-processing inventory for providers, analytics, or cross-repository transfers.
- No residency, backup, restore, or disaster-recovery evidence.

## Supply-chain and deployment

- CI actions are version-tagged but not pinned to immutable commit SHAs.
- A frozen lockfile install is configured in CI; README/recovery instructions still include non-frozen installation for repair workflows.
- No current dependency vulnerability report, SBOM, artifact signature, provenance attestation, or deployer least-privilege evidence is recorded.

## Security release gates

Production release requires all of the following:

- SEC-001 fixed with emulator tests.
- Audit-branch tenant fix merged and tested.
- Cross-tenant API and callable tests.
- Storage authorization tests.
- Normalized security logging and retention policy.
- Dependency/security scan recorded.
- Deployed SHA and rollback SHA recorded.
- Live header, auth, readiness, and privacy-route verification.

Do not place exploit reproduction details, tokens, project secrets, or real user data in public issues or CI logs.
