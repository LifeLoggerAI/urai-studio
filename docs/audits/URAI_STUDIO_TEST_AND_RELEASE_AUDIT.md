# URAI Studio Test and Release Audit

Date: 2026-07-06  
Audited head: `4a1ce1bf39c821212f5b7565453761d85aad545c`

## What the repository is configured to run

Root release path:

```bash
corepack prepare pnpm@9.7.0 --activate
pnpm install --frozen-lockfile
pnpm release:check
pnpm --filter studio smoke:static
pnpm --filter studio start
HOST=http://127.0.0.1:3000 EXPECT_READY=false bash scripts/smoke.sh
```

`pnpm release:check` runs the audit suite, app build, and Functions build. The audit suite runs done-done, evidence, health, and provider guards followed by lint, typecheck, tests, and Studio smoke.

## Test architecture

- `apps/studio/tests/all.test.mjs` imports every `*.test.mjs` file in lexical order.
- `routes-smoke.mjs` is a static declaration check only.
- `scripts/smoke.sh` is the meaningful production-like HTTP test: it starts from a real server URL, checks page/API status, metadata, route markers, placeholder text, secret-like output, protected API behavior, readiness, and invalid form requests.
- Playwright is installed and a `test:e2e` script exists, but Playwright is not part of the default CI workflow shown in `.github/workflows/studio-ci.yml`.
- No Firebase emulator rule test command is present in the default release gate.

## Current execution evidence

| Gate | Current-head evidence |
| --- | --- |
| Frozen install | Not recorded |
| Lint | Not recorded |
| Typecheck | Not recorded |
| Regression tests | Not recorded |
| Next build | Not recorded |
| Functions build | Not recorded |
| Static smoke | Not recorded |
| Runtime HTTP smoke | Not recorded |
| Playwright | Not recorded |
| Firestore/Storage emulator tests | Not present/proven |
| Dependency/security scan | Not recorded |
| Firebase deploy | Not recorded |
| Production smoke | Not recorded |

The current head has no attached combined status checks in the inspected GitHub metadata. The repository release ledger also keeps these gates pending. Therefore CI, build, and deployment status are **unverified**, not failed and not passed.

## Coverage assessment

| Area | Existing coverage | Missing high-value coverage | Risk |
| --- | --- | --- | --- |
| Route source presence | Static declaration and file-presence tests | Automatic route discovery; stale-list detection | Medium |
| Runtime pages/APIs | Strong shell smoke script | Authenticated success paths; browser behavior | High |
| Auth | Source guards and unauthenticated smoke | Two-user tenant-isolation integration tests | Critical |
| Firestore rules | Rules file presence | Emulator allow/deny matrix and membership escalation tests | Critical |
| Storage rules | Source-level tests/presence | Emulator tests tied to membership revocation | Critical |
| Functions | TypeScript build gate | Unit tests for claim/retry/terminal/dead-letter behavior | High |
| Jobs | Contract/source tests | Concurrency, lease expiry, idempotency, bounded batches | High |
| Providers | Readiness guard | Provider sandbox contract tests and receipt verification | High |
| Exports | Contract tests | Package creation, hash, download authorization, expiry/deletion | High |
| Forms | Invalid-request HTTP smoke | Persisted success, abuse/rate-limit behavior | Medium |
| Accessibility | Basic markup work | Automated axe/browser and keyboard journey | High |
| Visual/mobile | None proven | Visual snapshots and responsive browser matrix | Medium |
| Performance | None proven | Bundle budgets, Core Web Vitals, API latency/load tests | Medium |
| Recovery | Runbook text | Tested rollback, restore, and incident exercise | High |

## New regression guards on audit branch

- `studio-auth-tenant-binding.test.mjs` prevents production tenant fallback from returning to a caller-controlled header.
- `job-runner-max-attempts.test.mjs` ensures the maximum-attempt guard occurs before processing.

These are source regression guards, not substitutes for Firebase/Auth emulator integration tests.

## CI/CD risks

- CI triggers on push and pull request to `main`, but current-head evidence is absent.
- CI has only `contents: read`, which is appropriate for verification; deployment is not represented in this workflow.
- No immutable build artifact is uploaded and promoted between environments.
- No deployment environment approval, artifact digest, release provenance, post-deploy smoke attachment, or automatic rollback gate is proven.
- App Hosting and Hosting are both configured in repository files; the canonical production deployment mechanism needs one explicit decision and receipt format.

## Required release evidence format

Every release candidate must record:

- source SHA and clean working-tree proof;
- Node/pnpm versions and lockfile hash;
- exact commands and full pass/fail results;
- built artifact identifier/digest;
- Firebase project and deployment target;
- deployed SHA and deployment timestamp;
- production base URL;
- live smoke result;
- last-known-good/rollback SHA;
- migration state and provider-cost gate state;
- reviewer/approval when rules, billing, or production data are affected.

## Release conclusion

The repository contains a credible release gate design, but the current commit does not have the evidence required to call it releasable. V50 requires current-head CI, rules tests, deployment receipt, live smoke, and rollback proof.
