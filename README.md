# URAI Studio

Creator and admin studio for URAI: public site, cinematic AI studio surfaces, Firebase-backed contact and waitlist flows, system diagnostics, and launch-safe module pages.

## Current release status

URAI Studio has a real app/backend foundation, but it must not be called production frozen until the release evidence ledger is filled with clean install, lint, typecheck, test, app build, Functions build, guard, deploy, and live smoke proof.

Canonical current audit and operations documents:

- `docs/audits/URAI_STUDIO_FULL_REPO_AUDIT.md` — current evidence-backed repository audit.
- `docs/audits/URAI_STUDIO_SYSTEM_INVENTORY.md` — application, API, function, persistence, integration, and operations inventory.
- `docs/audits/URAI_STUDIO_GAP_REGISTER.md` — prioritized human-readable gap register.
- `docs/audits/urai-studio-gap-register.yaml` — machine-readable P0/P1 gap register.
- `docs/audits/URAI_STUDIO_SECURITY_PRIVACY_AUDIT.md` — security, authorization, privacy, and data-rights findings.
- `docs/audits/URAI_STUDIO_TEST_AND_RELEASE_AUDIT.md` — test coverage, CI/CD, deployment evidence, and missing-test matrix.
- `docs/architecture/URAI_STUDIO_CANONICAL_ARCHITECTURE.md` — canonical V50 architecture and migration direction.
- `docs/roadmap/URAI_STUDIO_V50_V100_V150_V200_ROADMAP.md` — dependency-ordered completion roadmap and scorecard.
- `docs/operations/URAI_STUDIO_RELEASE_RUNBOOK.md` — release gates and evidence requirements.
- `docs/operations/URAI_STUDIO_ROLLBACK_AND_INCIDENT_RUNBOOK.md` — rollback, containment, recovery, and incident evidence.
- `docs/operations/URAI_STUDIO_PROVIDER_COST_CONTROL.md` — disabled-by-default provider and spend controls.

Supporting status documents:

- `docs/URAI_STUDIO_DOCS_INDEX_2026-06-16.md` - navigation index for earlier audit docs, contracts, guards, and proof templates.
- `docs/URAI_STUDIO_FULL_AUDIT.md` - earlier repo/system audit snapshot and safe release language.
- `docs/URAI_STUDIO_SYSTEM_PIPELINES_AUDIT_2026-06-16.md` - earlier system-of-systems pipeline audit.
- `docs/URAI_STUDIO_REMAINING_BLOCKERS_2026-06-16.md` - earlier proof-blocker snapshot.
- `docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md` - deploy proof record template for observed CI, deploy target, base URL, and remote endpoint checks.
- `docs/URAI_STUDIO_RELEASE_EVIDENCE.md` - release proof ledger that must be completed before production lock.
- `docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json` - machine-readable release evidence shape.
- `docs/URAI_STUDIO_ECOSYSTEM_URL_KEYS.md` - public ecosystem URL key map for diagnostics.
- `docs/URAI_STUDIO_DONE_DONE_LOCK.md` - canonical done-done scope and repo invariants.
- `docs/contracts/URAI_SYSTEM_CONTRACT.md` - system-of-systems contract terms.

## Repository shape

- `apps/studio` - Next.js Studio web app.
- `functions` - Firebase Cloud Functions.
- `packages/*` - shared workspace packages.
- `.idx/dev.nix` - Firebase Studio workspace configuration.
- `apphosting.yaml` - Firebase App Hosting runtime configuration.
- `docs/firebase-studio-recovery.md` - recovery runbook for stuck Firebase Studio environments.

## Runtime

- Node `>=20 <21`
- pnpm `9.7.0`
- Next app: `apps/studio`
- Firebase Hosting source: `apps/studio`
- Functions source: `functions`

## Fast start

```bash
corepack enable || true
corepack prepare pnpm@9.7.0 --activate || npm i -g pnpm@9.7.0
pnpm install --no-frozen-lockfile
pnpm build
pnpm run studio:preview
```

The preview script runs the Studio app under `apps/studio` on the configured port. The non-frozen install is limited to local dependency-repair workflows; release and CI verification use the committed lockfile.

## Firebase Studio recovery

When Firebase Studio gets stuck on **Building environment**:

```bash
git pull
pnpm run studio:repair
pnpm run studio:preview
```

Start emulators only after the app builds:

```bash
pnpm run firebase:emulators
```

## Audit commands

```bash
pnpm done-done:guard
pnpm evidence:guard
pnpm health:guard
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
pnpm studio:smoke
```

The combined audit command is:

```bash
pnpm audit
```

## Full release proof commands

```bash
set -euo pipefail
corepack prepare pnpm@9.7.0 --activate
pnpm install --frozen-lockfile
pnpm release:check
HOST=http://127.0.0.1:3000 EXPECT_READY=false pnpm studio:smoke
```

After deployment:

```bash
HOST=https://www.uraistudio.com EXPECT_READY=true EXPECT_PROTECTED_AUTH=true bash scripts/smoke.sh
```

Record the output in `docs/URAI_STUDIO_RELEASE_EVIDENCE.md` and `docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md` before claiming production freeze. Also record the exact deployed SHA and last-known-good rollback SHA.

## Environment variables

Copy `.env.example` and fill values in Firebase App Hosting / Hosting environment settings. Public frontend values use `NEXT_PUBLIC_*`; service account values must stay server-only.

Required or common values:

```bash
NEXT_PUBLIC_SITE_URL=https://www.uraistudio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_ASSET_FACTORY_URL=
ASSET_FACTORY_INTERNAL_URL=
NEXT_PUBLIC_URAI_SPATIAL_URL=
NEXT_PUBLIC_URAI_JOBS_URL=
NEXT_PUBLIC_URAI_CONTENT_URL=
NEXT_PUBLIC_URAI_MARKETING_URL=
NEXT_PUBLIC_URAI_ANALYTICS_URL=
NEXT_PUBLIC_URAI_ADMIN_URL=
NEXT_PUBLIC_URAI_PRIVACY_URL=
NEXT_PUBLIC_URAI_INVESTORS_URL=
NEXT_PUBLIC_B2B_PORTAL_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Deployment notes

- Firebase Studio should not auto-start emulators during workspace boot.
- Dependency repair may use `pnpm install --no-frozen-lockfile`, but any resulting lockfile change must be reviewed and committed before release verification.
- CI and release verification must use `pnpm install --frozen-lockfile`.
- The canonical production deployment mechanism—Firebase Hosting, Firebase App Hosting, or an explicitly documented combination—must be resolved and recorded before deployment.
- No provider-backed feature may be enabled without explicit credentials, billing, budget, privacy, and kill-switch approval.
