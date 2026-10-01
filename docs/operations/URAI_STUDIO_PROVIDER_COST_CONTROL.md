# URAI Studio Provider Cost and Execution Control

Status: **FOUNDATION COMPLETE / EXECUTION HARD-OFF**

Authority issue: `LifeLoggerAI/urai-studio#55`.

This document defines the minimum governance contract for any paid or external provider execution initiated by URAI Studio. It does **not** authorize a provider, credential, model, spend, deployment or public release.

## Required provider states

Every provider adapter must expose one of:

- `disabled`: no execution contract is available;
- `demo`: local/non-billable simulation only;
- `configured`: configuration exists but execution is not authorized;
- `live`: reserved for separately authorized production execution;
- `paused`: execution was intentionally stopped and requires reauthorization.

Source configuration alone may never move a hard-off provider to `live`.

## Mandatory controls before a paid attempt

A production provider attempt must be blocked unless all of the following are independently proven:

- protected provider identity and credential authority;
- explicit tenant and job identity;
- non-empty idempotency key;
- bounded per-attempt cost;
- bounded per-job cost;
- bounded daily cost;
- bounded timeout;
- bounded retry count;
- kill switch released under protected governance;
- provenance capture;
- retained execution receipt;
- tenant-scoped artifact destination;
- approved content/rights/consent inputs where applicable;
- explicit activation authority;
- separately approved public-release authority where publication is requested.

## Source defaults

`apps/studio/lib/studio/provider-control.ts` intentionally constructs provider policies with:

- `hardOff: true`;
- `activationAuthorized: false`;
- `publicReleaseAuthorized: false`;
- kill switch engaged by default;
- maximum timeout of 120 seconds;
- maximum attempt count of 3;
- mandatory idempotency, provenance, receipt and tenant scope.

There is intentionally no source-only helper that converts this policy into a live-authorized provider. Production authorization belongs to protected governance and retained runtime evidence.

## Budget hierarchy

All values are integer cents in USD.

`maxAttemptCents <= maxJobCents <= maxDailyCents`

A request that violates this hierarchy is invalid before any provider request is constructed.

Actual provider billing receipts must be reconciled to the estimate after execution. Reconciliation is a runtime/provider concern and is not fabricated by this source contract.

## Retry and failure semantics

Retries must be deterministic, bounded and idempotent. A retry must preserve the same logical job identity and must not multiply charges simply because a network response was ambiguous.

Terminal provider failure must retain:

- provider/job correlation ID;
- attempt count;
- error classification;
- cost/receipt information available;
- artifact state;
- provenance state;
- next safe operator action.

Dead-letter recovery must require explicit operator action and must never silently repurchase the same generation.

## Artifacts and exports

A provider response is not a production asset merely because the request succeeded.

Production artifact promotion additionally requires:

- verified object existence;
- checksum;
- size;
- MIME/type validation;
- tenant scope;
- source/provider lineage;
- review/promotion state;
- retention/deletion rules.

Downloadable export packages additionally require authorization, expiry, and revocation semantics.

## Activation boundary

Before changing the classification from **COMPLETE / HARD-OFF** to live provider execution, retain evidence for:

1. provider account and approved model;
2. protected identity and secret management;
3. exact spend ceilings;
4. kill-switch authority;
5. adapter contract tests;
6. idempotency/retry/dead-letter tests;
7. artifact verification;
8. authorized export/download tests;
9. protected deployment;
10. live execution receipt;
11. rollback/recovery proof;
12. independent review where required.

Until those receipts exist, Studio must report provider execution as hard-off or unavailable.
