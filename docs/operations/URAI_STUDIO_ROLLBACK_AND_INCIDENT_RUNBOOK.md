# URAI Studio Rollback and Incident Runbook

Repository: `LifeLoggerAI/urai-studio`  
Production domain configured in source: `https://www.uraistudio.com`

## Incident principles

1. Protect users and data before preserving feature availability.
2. Disable paid providers and destructive actions before investigating cost or integrity anomalies.
3. Never roll forward blindly. Identify the deployed SHA, failing surface, data state, and last-known-good SHA.
4. Preserve logs, receipts, timestamps, and artifact identifiers without copying secrets or personal data into public issues.
5. A code rollback does not automatically reverse Firestore, Storage, rules, IAM, or schema changes.

## Severity guide

- **SEV-0:** confirmed cross-tenant access, secret exposure, destructive data loss, uncontrolled provider spend, or compromised administrative access.
- **SEV-1:** production unavailable, authentication broken, exports exposed incorrectly, queue corruption, or widespread failed jobs.
- **SEV-2:** degraded feature, isolated workflow failure, delayed jobs, or non-critical integration outage.
- **SEV-3:** cosmetic or low-impact defect with safe workaround.

## Immediate containment

For SEV-0/1:

- freeze deployments and merges affecting production;
- record current time, reporter, domain, Firebase project, deployment/revision IDs, and observed SHA;
- disable provider execution through the approved kill switch or environment gate;
- disable or gate the affected route/action without weakening authentication;
- revoke exposed credentials and sessions through the owning platform when compromise is suspected;
- preserve relevant structured logs and audit records;
- notify the designated security/product owner privately.

Do not delete evidence, rotate unrelated secrets, or run broad database repair scripts before the scope is understood.

## Establish production truth

Record:

```bash
git rev-parse <suspected-deployed-ref>
git show --stat --oneline <sha>
git diff <last-known-good-sha>..<deployed-sha>
```

Confirm independently:

- source SHA represented by deployment metadata;
- Firebase project and hosting/backend target;
- current Functions revisions;
- active rules versions;
- migration/version marker;
- provider mode and cost state;
- last-known-good SHA and its live-smoke evidence.

If the deployed SHA cannot be proven, treat that as a release incident and restore from the last deployment with a verified receipt.

## Rollback decision

Use rollback when the defect is introduced by deployable code/config and the previous release remains compatible with current data and rules.

Use feature disablement or a forward repair instead when:

- a migration is not backward compatible;
- a provider or downstream contract changed irreversibly;
- rollback would reintroduce a security defect;
- the previous release lacks valid evidence;
- the failure is external and the local fallback is safe.

## Code/application rollback

1. Select the recorded last-known-good SHA.
2. Verify its CI, deployment, smoke, and security evidence.
3. Confirm current data/rules remain compatible.
4. Create a dedicated rollback branch or platform rollback action that clearly identifies both SHAs.
5. Run the release checks against the rollback source.
6. Deploy to staging when time and impact permit; for a SEV-0 emergency, use the approved emergency path and document the exception.
7. Deploy the exact rollback source/artifact to production.
8. Run production smoke and targeted incident checks.
9. Record the new deployment receipt and incident timeline.

Never label a branch or tag as last-known-good without attached evidence.

## Functions and rules rollback

Functions, Firestore rules, and Storage rules may require separate rollback actions. Before changing them:

- compare exported function names, runtimes, regions, triggers, and environment requirements;
- verify scheduled/background jobs will not duplicate work;
- verify old rules do not reopen the original vulnerability;
- test the target rules in Firebase emulators;
- ensure queued documents are compatible with the restored workers.

After rollback, verify authentication, membership, cross-tenant denial, uploads/downloads, jobs, exports, and public intake.

## Data recovery

Data repair requires a written scope and dry-run evidence:

- affected collections/storage prefixes;
- selection query and expected document count;
- backup/export identifier;
- reversible mutation plan;
- idempotency strategy;
- reviewer approval;
- before/after checksums or counts where practical.

Do not use client-visible timestamps as the only recovery boundary. Preserve audit history and attach repair receipts.

## Provider-cost incident

- set all provider adapters to disabled;
- cancel queued provider work without deleting evidence;
- capture provider request/receipt IDs and spend totals;
- rotate provider keys only when compromise is suspected;
- reconcile Studio job IDs to provider receipts;
- do not re-enable until the cause, cap, and kill switch are tested.

## Verification after containment or rollback

Required checks:

- `/healthz` and release-profile `/readyz`;
- `scripts/smoke.sh` against production;
- authenticated tenant-isolation tests;
- affected job/export/provider workflow;
- error rate, queue depth, latency, and spend;
- security headers and no-secret response scan;
- audit/event continuity;
- deployed and rollback SHAs.

## Incident record

Create a private-safe incident record with:

- severity and impact;
- detection and containment timestamps;
- affected users/tenants/data classes;
- deployed, last-known-good, and rollback SHAs;
- Firebase/deployment receipts;
- root cause and contributing controls;
- remediation and regression tests;
- notification/legal review requirements;
- follow-up owners and release gates.

Public GitHub issues must contain only sanitized summaries. Security-sensitive reproduction details belong in an appropriately restricted channel.
