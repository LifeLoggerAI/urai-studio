# URAI Studio Canonical Architecture

Baseline: `main@4a1ce1bf39c821212f5b7565453761d85aad545c`  
Status: canonical V50 architecture and migration direction

## Canonical source roots

- `apps/studio` — the only production Next.js application.
- `functions` — the only production Firebase Functions source.
- `packages/*` — shared libraries consumed by canonical deployable units.
- `docs/*` — contracts, audits, runbooks, evidence, and roadmap.

Historical application roots, backup files, generated audit snapshots, local deploy scripts, and `brain-map-ui` are non-canonical unless code is migrated into `apps/studio` through a reviewed pull request.

## Runtime boundaries

### Web application

`apps/studio` owns:

- public product and legal routes;
- authenticated operator/creator interfaces;
- Next.js route handlers;
- system manifest, readiness, contract, and health surfaces;
- Firebase client initialization;
- Firebase Admin-backed server routes;
- presentation of integration status and provider mode.

### Firebase Functions

`functions` owns:

- privileged callable functions;
- scheduled/background job execution;
- trusted administrative operations;
- server-side audit events;
- provider adapter execution when explicitly enabled;
- durable artifact and export processing.

No client or public route may impersonate a worker, bypass a policy gate, or write server-owned state directly.

### Shared packages

`packages/*` may contain:

- versioned schemas and generated types;
- provider and integration interfaces;
- validation libraries;
- evidence/receipt formats;
- policy primitives that must match web and Functions.

Packages must not silently initialize production credentials or deploy resources.

## Identity, tenancy, and authorization

The target model is:

1. Firebase Authentication establishes a verified user identity.
2. A server-controlled membership record or verified tenant claim establishes tenant/studio membership.
3. A canonical RBAC policy maps membership to owner/admin/editor/reviewer/viewer capabilities.
4. API routes, callables, Firestore rules, and Storage rules enforce the same policy.
5. Every persisted project, brief, job, asset, export, event, and receipt includes canonical `tenantId`, `userId`/actor, and ownership metadata.
6. Public request headers never grant production tenant membership or roles.

The current uid-owned legacy model and `studioId` membership model must be consolidated under a migration ADR.

## Canonical domain model direction

V50 must converge on one collection family:

- `studioProjects`
- `studioBriefs`
- `studioJobs`
- `studioAssets`
- `studioExports`
- `studioEvents`
- `studioProviderReceipts`
- `studioAuditLogs`
- `studioMemberships` or a clearly versioned shared membership collection

Each record must have a versioned schema, tenant scope, lifecycle state, timestamps, actor/source, and migration version. Existing `projects`, `jobs`, `assetJobs`, `exportJobs`, and related legacy collections require an explicit read/write compatibility and retirement plan; new code must not create another parallel model.

## Job lifecycle

Canonical states:

```text
queued -> claimed -> running -> review_required -> approved -> succeeded
                         |              |             |
                         +-> retry_wait +-> rejected  +-> failed
                         +-> cancelled
                         +-> dead_letter
```

Required properties:

- idempotency key;
- bounded claim batch;
- lease owner and expiry;
- attempt number and retry schedule;
- provider mode and adapter version;
- input/output artifact references;
- consent/policy decision;
- cost estimate and receipt references;
- error classification;
- audit/event history.

A job cannot become succeeded merely because a fallback file or manifest record was written.

## Asset and export lifecycle

Assets and exports are immutable, tenant-scoped records that reference Storage objects by controlled path. A ready artifact requires:

- verified existence;
- checksum, size, and MIME type;
- source/job/provider lineage;
- ownership and consent state;
- safety/review state;
- retention/deletion class;
- authorized access mechanism.

Exports must be packaged artifacts, not only Firestore manifests. Download authorization is server-issued, expiring, and tenant-scoped.

## Integration architecture

Every external URAI system uses a versioned adapter with:

- explicit base URL and environment;
- authenticated request contract;
- schema/version negotiation;
- timeout and bounded retry policy;
- idempotency key;
- correlation/trace ID;
- health/readiness semantics;
- sanitized logs and metrics;
- receipt/evidence record;
- fallback/disabled behavior;
- owning repository and release dependency.

A configured URL is not a connected integration. Studio must distinguish `missing`, `configured`, `degraded`, `live`, and `paused` based on observed behavior.

## Provider architecture

Provider adapters run only on trusted server/worker surfaces and implement the controls in `docs/operations/URAI_STUDIO_PROVIDER_COST_CONTROL.md`. The default mode is disabled. Credentials never reach browser bundles, public contract responses, or repository evidence.

## Health, readiness, and observability

- `/healthz` proves process liveness only.
- `/readyz` evaluates a named release profile and required dependencies.
- system/integration endpoints expose sanitized state and contracts, not secrets.
- all requests/jobs use correlation IDs.
- structured logs, metrics, traces, queue depth, provider spend, and artifact failures feed an operational dashboard and alerts.
- deployment metadata exposes the source SHA safely for release proof.

## Deployment architecture

The repository currently contains both Firebase Hosting source configuration and App Hosting runtime configuration. V50 must choose and document the canonical production path or precisely define why both are used.

Required deployment properties:

- Node 20 and pnpm 9.7.0;
- frozen lockfile install;
- immutable reviewed source/artifact;
- staging before production;
- environment approval for production;
- source SHA and artifact/deployment receipt;
- post-deploy smoke and authorization checks;
- recorded last-known-good and rollback SHA;
- separate handling of app, Functions, rules, Storage rules, and migrations.

## Security and privacy boundaries

- deny direct client access to server-owned collections;
- least-privilege service accounts and environment secrets;
- owner-controlled membership and role transitions;
- server-enforced provider and publishing kill switches;
- explicit consent and data-purpose records;
- complete data export/deletion/retention operations;
- sanitized audit and incident evidence;
- enforced CSP and production security headers after compatibility validation.

## Architecture decisions required for V50

1. Canonical membership and role model.
2. Canonical project/job/asset/export collections and migration.
3. Firebase Hosting versus App Hosting deployment ownership.
4. Release-profile dependency requirements.
5. Brain Map migration into `apps/studio` or removal from active source.
6. Provider adapter and receipt schema.
7. Cross-repository authentication and contract ownership.

No V100 production feature should add a new data or authorization model before these decisions are recorded and enforced.
