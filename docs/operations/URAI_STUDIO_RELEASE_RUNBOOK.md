# URAI Studio Release Runbook

Repository: `LifeLoggerAI/urai-studio`  
Canonical app: `apps/studio`  
Canonical backend: `functions`  
Canonical branch: `main`

This runbook defines the minimum evidence required to release URAI Studio. It does not authorize billing, provider calls, secret changes, database migrations, or a production deployment by itself.

## 1. Release prerequisites

A release candidate may proceed only when:

- all P0 gaps in `docs/audits/URAI_STUDIO_GAP_REGISTER.md` are closed;
- the source branch is based on current `main` and has no unreviewed production-data migration;
- the intended deployment mechanism is named explicitly: Firebase Hosting, Firebase App Hosting, or both;
- Firebase project, hosting target, functions region, custom domain, and release operator are confirmed;
- required secrets exist in the deployment environment without being printed;
- provider-backed features remain disabled unless billing and provider use were explicitly approved;
- the last-known-good production SHA and rollback method are known.

## 2. Establish the release identity

Record before building:

```bash
git fetch --all --prune
git checkout <release-branch-or-sha>
git status --short
git rev-parse HEAD
node --version
corepack pnpm --version
sha256sum pnpm-lock.yaml
```

Required evidence:

- source SHA;
- branch/ref;
- clean working tree;
- Node and pnpm versions;
- lockfile checksum;
- release operator and timestamp.

## 3. Reproducible verification

Run from the repository root in Node 20:

```bash
set -euo pipefail
corepack enable
corepack prepare pnpm@9.7.0 --activate
pnpm install --frozen-lockfile
pnpm release:check
pnpm --filter studio smoke:static
```

The release is blocked if any command fails or is skipped. A non-frozen install is a repair action, not release evidence.

## 4. Production-like local smoke

Start the production build and run the HTTP smoke suite:

```bash
pnpm --filter studio start > /tmp/urai-studio.log 2>&1 &
STUDIO_PID=$!
trap 'kill "$STUDIO_PID" 2>/dev/null || true' EXIT

for i in $(seq 1 30); do
  curl -fsS http://127.0.0.1:3000/healthz >/dev/null && break
  sleep 2
done

HOST=http://127.0.0.1:3000 EXPECT_READY=false bash scripts/smoke.sh
```

Also run the Firebase emulator authorization suite once it exists. A release cannot waive tenant-isolation tests.

## 5. Build and preserve release artifacts

The release record must identify:

- application build output or deployment bundle;
- Functions build output;
- source SHA embedded in an endpoint, metadata record, or deployment receipt;
- artifact checksum/digest where the deployment platform exposes one;
- dependency lockfile checksum;
- test and smoke logs.

Do not rebuild different source between staging and production. Promote the same reviewed source/artifact.

## 6. Staging verification

Deploy only to the approved staging project/target. Record:

- Firebase project and target;
- deployment command and output;
- deployed SHA;
- staging URL;
- `/healthz`, `/readyz`, and `scripts/smoke.sh` results;
- authenticated two-user tenant-isolation result;
- public form persistence behavior;
- provider mode (`disabled`, `demo`, or approved live mode);
- migration result, when applicable.

A staging release is blocked if `/readyz` disagrees with the chosen release profile or any feature reports live success while operating in fallback mode.

## 7. Production approval gate

Production deployment requires explicit approval when any of these are involved:

- Firebase production changes;
- Functions or rules changes;
- secrets or IAM changes;
- billing or paid providers;
- database/storage migration;
- privacy, retention, or legal-policy changes;
- public-domain cutover.

Record the approver and the exact SHA approved.

## 8. Production deployment

Use the repository's approved Firebase deployment path after the target decision is documented. Never infer the target from local CLI state alone; verify `.firebaserc`, Firebase project selection, and the intended hosting mechanism first.

Required deployment receipt:

- source SHA;
- Firebase project ID and hosting/backend target;
- deployment ID or platform receipt;
- deployment timestamp;
- custom domain and platform URL;
- Functions revisions/regions where applicable;
- previous deployed SHA;
- rollback SHA.

## 9. Post-deploy verification

Run immediately:

```bash
HOST=https://www.uraistudio.com EXPECT_READY=true EXPECT_PROTECTED_AUTH=true bash scripts/smoke.sh
```

Verify additionally:

- security headers on representative pages and APIs;
- production APIs reject unauthenticated requests;
- two authenticated users cannot cross tenant boundaries;
- contact/waitlist persistence writes only expected collections;
- no fallback artifact is presented as externally ready;
- logs contain the release SHA and no secret values;
- provider spend remains zero unless approved.

## 10. Release evidence record

Update `docs/URAI_STUDIO_RELEASE_EVIDENCE.md` or attach an immutable CI/deployment artifact containing:

- every command and result;
- CI run and commit;
- deployment receipt;
- live smoke output;
- deployed and rollback SHAs;
- known warnings;
- provider-cost state;
- migration state;
- reviewer approval.

## 11. Release stop conditions

Stop and roll back or disable the affected feature when:

- authentication or tenant isolation fails;
- `/readyz` fails for the approved release profile;
- a job can succeed without a verified artifact;
- provider spend exceeds the configured cap;
- secrets or personal data appear in logs/responses;
- contact/waitlist writes go to an unexpected project;
- error rate, queue depth, or latency exceeds the incident threshold;
- the deployed SHA cannot be proven.

A release is complete only after the production evidence is attached and the rollback path is still valid.
