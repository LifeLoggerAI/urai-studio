# URAI Studio Provider Cost Control

## Governing rule

All paid or metered provider execution is **disabled by default**. Repository presence, environment-variable names, a configured URL, or a health response does not authorize spending.

Provider execution requires explicit approval for:

- provider and account;
- environment;
- maximum budget;
- permitted models/actions;
- maximum per-job cost;
- maximum concurrency and daily volume;
- data classes permitted to leave URAI-controlled infrastructure;
- retention/deletion expectations;
- operator and expiry time for the approval.

## Required provider modes

Every adapter must report exactly one mode:

- `disabled` — cannot issue provider requests;
- `demo` — deterministic/local fixtures only, no paid request;
- `configured` — credentials/config are present but execution remains blocked;
- `live` — explicitly approved execution within active limits;
- `paused` — kill switch active after approval or incident.

UI, APIs, logs, jobs, and readiness must show the same mode. Fallback or demo output must never be marked externally ready.

## Preflight controls

Before each request, enforce:

- allowlisted provider, operation, model, and region;
- authenticated tenant and authorized user/action;
- required consent and data-policy checks;
- request-size and output-count limits;
- per-job estimated-cost ceiling;
- tenant and global hourly/daily/monthly remaining budget;
- concurrency and rate limits;
- idempotency key;
- timeout and maximum retry count;
- active kill-switch state.

A failed preflight creates a non-billable rejected job event with a safe reason.

## Cost ledger and receipts

Every approved provider attempt must record a sanitized receipt:

```text
providerReceiptId
studioJobId
attemptId
tenantId
provider
operation
model
requestTimestamp
completionTimestamp
estimatedCost
actualCost
currency
inputUnits
outputUnits
artifactIds
providerStatus
retryOf
approvalId
```

Do not store prompts, credentials, personal content, or provider response bodies in a cost ledger unless separately authorized and protected. The ledger must reconcile one Studio attempt to one provider receipt and preserve failed/charged attempts.

## Budget hierarchy

Apply the strictest active limit from:

1. emergency global kill switch;
2. provider/account cap;
3. environment cap;
4. tenant cap;
5. project/campaign cap;
6. job cap;
7. model/operation cap.

Recommended fail-safe behavior is deny, not best-effort execution, when the remaining budget cannot be determined.

## Retry policy

- Never retry an unknown provider result without idempotency support or reconciliation.
- Do not retry validation, authentication, policy, or budget failures.
- Use bounded exponential backoff with jitter for eligible transient failures.
- Charge and display every attempt, including failed attempts that incurred cost.
- Move exhausted work to a dead-letter or review state; do not loop indefinitely.

## Artifact verification

A provider request can become `succeeded` only when:

- provider receipt/status is reconciled;
- expected artifacts exist;
- size, MIME type, checksum, and safety checks pass;
- artifact ownership/tenant scope is recorded;
- cost is recorded or explicitly marked pending reconciliation;
- no kill-switch or policy violation occurred.

Otherwise use `failed`, `review_required`, `cost_pending`, or `artifact_invalid`—never synthetic success.

## Kill switches

Required controls:

- global provider execution off;
- provider-specific off;
- model/operation off;
- tenant/project off;
- queue intake pause;
- worker claim pause;
- publish/export pause.

Kill switches must be server-enforced, auditable, and testable without changing source code. Public client flags alone are insufficient.

## Alerts

Alert before and at limits for:

- budget utilization;
- abnormal request volume;
- cost per successful artifact;
- repeated paid failures;
- unreconciled receipts;
- spend while mode is not `live`;
- duplicate idempotency keys;
- cost without a matching Studio job or approval.

## Provider onboarding gate

A provider cannot be promoted to `live` until it has:

- versioned adapter contract;
- sandbox/demo tests;
- timeout, retry, idempotency, and cancellation behavior;
- receipt and cost reconciliation;
- data-processing/privacy review;
- secret-management and least-privilege review;
- artifact verification;
- incident and deletion procedures;
- approved budget and kill-switch test;
- staging evidence and human approval.

## Current repository conclusion

Current job and generation paths are fallback/scaffold or contract-only. No provider call or spend was authorized or executed by this audit. V100 requires implementation of this control plane before paid generation can be considered production-ready.
