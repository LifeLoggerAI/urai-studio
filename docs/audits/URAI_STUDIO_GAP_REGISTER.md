# URAI Studio Gap Register

Priorities reflect release risk. `Now` means safe work was completed on the audit branch; `Issue` means tracked work remains.

| ID | Priority | Gap | Evidence | Required acceptance | Disposition |
| --- | --- | --- | --- | --- | --- |
| STU-001 | P0 | Production tenant could use caller-controlled tenant header when token lacked tenant claim | `apps/studio/lib/studio-auth.ts` | Tenant comes only from verified claim or authenticated uid; regression test passes | Fixed on audit branch |
| STU-002 | P0 | Maximum-attempt job could be marked failed and still processed | `functions/src/job-runner.ts` | Terminal outcome exits before `processJob`; audit event recorded | Fixed on audit branch |
| STU-003 | P0 | Firestore membership self-enrollment/role escalation | `firestore.rules` membership create/update rules | Invitation/owner-controlled membership; role transitions constrained; emulator abuse tests pass | Issue required |
| STU-004 | P0 | Current head lacks release/deploy/live-smoke proof | empty current-head statuses; pending release ledger | Frozen install, release check, Functions build, local smoke, deploy receipt, live smoke, deployed SHA and rollback SHA recorded | Issue required |
| STU-005 | P1 | Readiness can report ready while production-critical integrations are missing | `status.ts` vs `integrations.ts`/`modules.ts` | Explicit release profile defines required integrations and `/readyz` enforces it | Issue required |
| STU-006 | P1 | Job/export request enum values are cast rather than strictly validated | API routes and runtime store | Reject unsupported kinds with 400; unit/HTTP tests cover all values | Roadmap |
| STU-007 | P1 | Three overlapping project/job/export models | Functions, runtime store, rules collections | Canonical schema chosen; adapters/migration documented; duplicate writers retired | Roadmap |
| STU-008 | P1 | Provider execution is fallback/scaffold only | `job-runner.ts`, `studio-system.ts` | Feature-gated adapters, receipts, cost ceilings, artifact checks, no fake success | Roadmap |
| STU-009 | P1 | Export marks manifest ready without package, checksum, or authorized download | `processExportJob`, runtime store | Storage artifact, hash/size/MIME, tenant authorization, expiry, retention/deletion tests | Roadmap |
| STU-010 | P1 | Cross-repo integrations are URL/contract diagnostics, not proven calls | integration registry and contracts | Authenticated contract tests, retries, timeouts, idempotency, observability, receipts | Roadmap |
| STU-011 | P1 | Runner queries are unbounded and retry state relies on lease expiry | `job-runner.ts` | Bounded claim batch, deterministic retry schedule, dead-letter transition, concurrency tests | Roadmap |
| STU-012 | P1 | No current rules emulator suite proves tenant isolation | rules files and test inventory | Emulator tests for read/write denial, role escalation, cross-tenant storage access | Roadmap |
| STU-013 | P2 | Brain Map exists outside canonical app and is hard-coded | `brain-map-ui/src/BrainMap.tsx` | Move into `apps/studio`, consume authenticated graph API, responsive/a11y tests | Existing issue #51 |
| STU-014 | P2 | CSP is report-only and permits unsafe inline/eval | `apps/studio/next.config.ts` | Nonce/hash strategy, enforced CSP, report monitoring, browser tests | Roadmap |
| STU-015 | P2 | No proven notifications/approval inbox/escalation path | product trace | Operator approval, rejection, retry, notification, and audit trail E2E | Roadmap |
| STU-016 | P2 | Accessibility, visual, performance, and mobile gates are not release-enforced | test scripts | Automated a11y + browser matrix + performance budgets + visual baselines | Roadmap |
| STU-017 | P2 | Observability lacks metrics/traces/SLOs/alerts | current logging surfaces | Structured logs, trace IDs, queue/provider metrics, alerts and dashboards | Roadmap |
| STU-018 | P3 | Multi-region, residency, extension SDK, and enterprise governance absent | architecture | V200 architecture and validated platform contracts | Future |

## Release blocker rule

No P0 may be waived by documentation alone. A P0 closes only with code/rules changes, automated regression evidence, and—where deployment-sensitive—live verification and rollback evidence.
