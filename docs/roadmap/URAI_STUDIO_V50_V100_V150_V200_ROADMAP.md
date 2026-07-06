# URAI Studio V50–V200 Roadmap

Baseline: `main@4a1ce1bf39c821212f5b7565453761d85aad545c`  
Method: rounded five-point evidence bands. Source presence earns limited credit; connected, tested, deployed behavior earns full credit.

## Completion scorecard

| Area | Evidence-based readiness | Basis |
| --- | ---: | --- |
| Architecture | 55% | Canonical app/backend and contracts exist; duplicate data models and disconnected root remain |
| Frontend product | 60% | Broad route/shell inventory; core operator journeys and browser proof incomplete |
| Backend | 45% | Real Firebase rails; generation/export remain fallback/scaffold |
| Integrations | 20% | Mostly URLs, health, and contracts without authenticated execution receipts |
| Authentication/authorization | 35% | Firebase token verification exists; membership rules and unified RBAC incomplete |
| Data/persistence | 40% | Real collections and rules; overlapping schemas/migrations/backups unresolved |
| Asset orchestration | 20% | Job records and fallback artifacts, no real provider artifact lifecycle |
| Job orchestration | 35% | Queue/leases/retries exist; bounded claims, idempotency and dead-letter proof missing |
| Privacy/data rights | 30% | Rules and privacy surfaces exist; consent/export/deletion/retention proof missing |
| Security | 35% | Headers, deny rules, validation present; critical membership issue remains |
| Testing | 45% | Large regression suite and real HTTP smoke; emulator/E2E/a11y/load gaps |
| CI/CD | 35% | Strong verify workflow design; no current-head/deploy/promotion proof |
| Observability | 20% | Events, audits and logs exist; metrics, traces, SLOs and alerts absent |
| Documentation | 70% | Extensive docs/contracts/guards; some stale/conflicting proof language remains |
| Production operations | 20% | Runbook/evidence templates exist; no deployed SHA, rollback exercise or incident proof |
| V50 | 45% | Foundation exists but P0 security and release evidence are open |
| V100 | 25% | Product rails exist; real end-to-end operation is incomplete |
| V150 | 10% | Contract concepts exist; autonomous orchestration is not mature |
| V200 | 5% | Global/enterprise capabilities are primarily roadmap concepts |

## V50 — Stable, coherent foundation

| ID | Feature/repair and evidence | Prerequisites/dependencies | Effort / risk / priority | Acceptance, tests and deployment | Execution constraint |
| --- | --- | --- | --- | --- | --- |
| V50-01 | Merge verified-identity tenant binding (`studio-auth.ts`) | Current audit PR | S / high / P0 | Two-user API isolation test; lint/typecheck/build; production protected-route smoke | Autonomous now; production verification needs Firebase identities |
| V50-02 | Correct terminal job claim flow (`job-runner.ts`) | Functions build | S / high / P0 | Max-attempt job never calls processor; audit/event written; concurrency test | Autonomous now; emulator/CI needed |
| V50-03 | Redesign membership/RBAC rules (`firestore.rules`, `storage.rules`) | Decide owner/invite/member schema | M / critical / P0 | Owner-controlled invitation, constrained roles, revocation; Firestore/Storage emulator deny matrix | Human security review + Firebase emulator |
| V50-04 | Produce current-head release evidence | V50-01–03 merged | M / critical / P0 | Frozen install, `release:check`, Functions build, local smoke, deploy receipt, live smoke, deployed and rollback SHAs | Requires CI/Firebase deployment authority |
| V50-05 | Canonicalize project/job/asset/export schema | Inventory `jobs`, `studioJobs`, `assetJobs`, `exportJobs`, `studioExports` | L / high / P1 | ADR, schema, migration, compatibility adapter, duplicate writers retired | Product/data decision and migration review |
| V50-06 | Strict request schema validation | Canonical enums/contracts | M / high / P1 | Unsupported values return 400; bounded strings/arrays; API tests | Autonomous after schema decision |
| V50-07 | Align readiness with release profile | Define public-site vs full-platform readiness | S / high / P1 | `/readyz` reports explicit required services and fails honestly | Product/ops decision |
| V50-08 | Remove or integrate non-canonical Brain Map | Issue #51 and canonical app architecture | M / medium / P1 | Component lives under `apps/studio`, consumes real API, or prototype is removed/archived | Human product decision |
| V50-09 | Lock documentation source of truth | New audit set | S / low / P1 | README links canonical audit, architecture, roadmap, release ledger; stale claims labeled | Autonomous now |

**V50 release gate:** no open P0; CI and rule tests green; exact deployed and rollback SHAs recorded; no fallback feature presented as live.

## V100 — Complete production platform

| ID | Feature/repair and evidence | Prerequisites/dependencies | Effort / risk / priority | Acceptance, tests and deployment | Execution constraint |
| --- | --- | --- | --- | --- | --- |
| V100-01 | End-to-end project/brief/job/asset/review/export workflow | V50 canonical schema | XL / high / P0 | Operator creates project, submits job, observes state, reviews, approves/rejects, exports; browser E2E | Cross-repo and provider access |
| V100-02 | Provider adapter framework with disabled-by-default gates | Current fallback runner | L / critical / P0 | Adapter contracts, allowlist, timeouts, retries, cost ceilings, receipt IDs, artifact verification | Provider credentials/billing approval |
| V100-03 | Durable authorized export packages | Current manifest-only export | L / high / P0 | Package in Storage, hash/size/MIME, tenant-scoped expiring URL, retention/deletion | Firebase Storage and policy decision |
| V100-04 | Production job engine | Existing leases/retries | L / high / P1 | Bounded claims, idempotency keys, deterministic backoff, dead letters, cancellation, replay, load tests | Infrastructure review |
| V100-05 | Real ecosystem integrations | URL registry/contracts | XL / high / P1 | Authenticated Asset Factory, Jobs, Content, Spatial, Analytics, Admin, Privacy and B2B contract tests with receipts | External repo access and owners |
| V100-06 | Complete RBAC and tenancy | V50 membership model | L / critical / P0 | Owner/admin/editor/reviewer/viewer matrix across UI/API/callables/rules/storage | Security review |
| V100-07 | Privacy and data-rights operations | Consent contract types | L / high / P0 | Consent receipts, full export, deletion cascade, retention schedule, provider deletion evidence | Legal/policy review |
| V100-08 | Notifications and approval inbox | Job/review workflow | M / medium / P1 | In-app/email notification state, retry/escalation, audit trail, preferences | Email/provider access if enabled |
| V100-09 | Production observability and cost console | Events/audit logs | L / high / P1 | Structured logs, trace IDs, queue/provider metrics, budgets, alerts, dashboards and kill switch | Cloud monitoring/budget permissions |
| V100-10 | Staging-to-production promotion | Current verify-only CI | L / high / P0 | Immutable artifact, environment approval, migration gate, smoke, rollback automation, provenance | GitHub environments/Firebase authority |

**V100 gate:** Studio can operate the URAI production chain end-to-end with real receipts, privacy controls, observability, and tested rollback.

## V150 — Expanded autonomous operating system

| ID | Feature/repair and evidence | Prerequisites/dependencies | Effort / risk / priority | Acceptance, tests and deployment | Execution constraint |
| --- | --- | --- | --- | --- | --- |
| V150-01 | Dependency-aware orchestration planner | V100 job engine/contracts | XL / high / P1 | DAG planning, explicit dependencies, resumability, deterministic audit record | Architecture/product review |
| V150-02 | Multi-model/provider routing | Provider adapters and cost console | XL / high / P1 | Policy-based quality/cost/latency routing, fallback, receipts, benchmark suite | Provider access/billing |
| V150-03 | Human approval and policy gates | RBAC/approval inbox | L / critical / P0 | No sensitive publish/release without policy and human gate; override/kill switch logged | Policy/legal review |
| V150-04 | Self-healing execution | Metrics and job engine | L / high / P1 | Classified retries, circuit breakers, quarantine, safe replay, anomaly-triggered pause | Ops review |
| V150-05 | Asset lineage and quality scoring | Durable assets/exports | L / high / P1 | Source/model/prompt/consent/version lineage, quality rubric, review evidence | Cross-repo schema alignment |
| V150-06 | Automated release candidates | Immutable CI/CD | L / high / P1 | Candidate assembly, evidence bundle, canary, approval, rollback recommendation | Deployment authority |
| V150-07 | Cross-repository coordination | Proven integrations | XL / high / P1 | Versioned work orders, status synchronization, dependency graph, receipts | GitHub access to all repos |

**V150 gate:** automation is bounded by policy, observable, reversible, cost-controlled, and always supports human override.

## V200 — Mature global ecosystem platform

| ID | Feature/repair and evidence | Prerequisites/dependencies | Effort / risk / priority | Acceptance, tests and deployment | Execution constraint |
| --- | --- | --- | --- | --- | --- |
| V200-01 | Multi-region and disaster recovery | V100 production operations | XL / critical / P1 | RPO/RTO targets, replicated design, tested restore/failover, regional runbooks | Cloud budget and architecture review |
| V200-02 | Advanced tenant isolation and residency | Canonical tenancy | XL / critical / P0 | Isolation threat model, residency controls, tenant keys/quotas, independent audit | Legal/security/cloud review |
| V200-03 | Extension/plugin architecture | Stable public contracts | XL / high / P1 | Sandboxed SDK, permissions, versioning, marketplace governance, compatibility tests | Ecosystem policy decision |
| V200-04 | Global localization/accessibility | Mature product UI | XL / high / P1 | Locale pipeline, RTL, assistive-tech matrix, accessibility certification target | Translation and specialist review |
| V200-05 | Enterprise governance/compliance readiness | Privacy/security operations | XL / critical / P1 | Evidence controls, access reviews, vendor risk, audit exports, policy mapping | Legal/compliance review |
| V200-06 | Public developer platform | Extension architecture | XL / high / P2 | Versioned APIs/SDKs, sandbox, quotas, keys, docs, deprecation policy | Product and security review |
| V200-07 | Ecosystem-wide release governance | Cross-repo coordination | XL / high / P1 | Signed provenance, compatibility matrix, staged rollout, global rollback | All repository owners and deployment authority |
| V200-08 | Capacity and cost governance | Global observability | XL / high / P1 | Forecasting, regional quotas, budget policies, admission control, capacity tests | Billing/finance policy |

**V200 gate:** independently reviewable global operations with resilience, governance, extensibility, localization, residency options, and durable provenance.

## Exact next execution order

1. Merge/test V50-01 and V50-02 through the audit PR.
2. Design and emulator-test V50-03 before any production release.
3. Run the current-head release gate and record immutable evidence (V50-04).
4. Decide and migrate the canonical data model (V50-05).
5. Enforce request schemas and release readiness (V50-06/07).
6. Resolve the disconnected Brain Map and canonical docs (V50-08/09).
7. Build V100 workflow, provider, export, RBAC, privacy, observability, and promotion rails in dependency order.
8. Begin V150 only after V100 receipts and rollback are proven; begin V200 only after mature production operations exist.
