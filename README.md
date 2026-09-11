# URAI Studio

Creator and admin studio for URAI: public site, cinematic AI studio surfaces, Firebase-backed contact and waitlist flows, system diagnostics, and launch-safe module pages.

## Current release status

URAI Studio has a real app/backend foundation, but it must not be called production frozen until the release evidence ledger is filled with clean install, lint, typecheck, test, app build, Functions build, guard, protected deploy, exact-revision readback, monitoring/recovery, and rollback proof.

Canonical status documents:

- `docs/URAI_STUDIO_DOCS_INDEX_2026-06-16.md` - current navigation index for audit docs, contracts, guards, and proof templates.
- `docs/URAI_STUDIO_FULL_AUDIT.md` - full repo/system audit, blocker list, and safe release language.
- `docs/URAI_STUDIO_SYSTEM_PIPELINES_AUDIT_2026-06-16.md` - system-of-systems pipeline audit across Jobs, Content, Asset Factory, Spatial, Analytics, Marketing, Admin, Privacy, Investors, and B2B Portal.
- `docs/URAI_STUDIO_REMAINING_BLOCKERS_2026-06-16.md` - current proof blockers that must be cleared before final lock.
- `docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md` - deploy proof record template for observed CI, deploy target, base URL, and remote endpoint checks.
- `docs/URAI_STUDIO_RELEASE_EVIDENCE.md` - release proof ledger that must be completed before production lock.
- `docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json` - machine-readable release evidence shape.
- `docs/URAI_STUDIO_ECOSYSTEM_URL_KEYS.md` - public ecosystem URL key map for diagnostics.
- `docs/URAI_STUDIO_DONE_DONE_LOCK.md` - canonical done-done scope and repo invariants.
- `docs/contracts/URAI_SYSTEM_CONTRACT.md` - system-of-systems contract terms.
- `URAI_STUDIO_RELEASE_LOCK.md` - fail-closed release and credential authority boundary.

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
pnpm install --frozen-lockfile
pnpm build
pnpm run studio:preview
```

The preview script runs the Studio app under `apps/studio` on the configured port. Preview success is not production authority.

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

## Source verification

```bash
set -euo pipefail
corepack prepare pnpm@9.7.0 --activate
pnpm install --frozen-lockfile
pnpm release:check
HOST=http://127.0.0.1:3000 pnpm studio:smoke
```

After an independently authorized protected deployment, the live smoke may target the governed Studio production URL. Record exact deployed SHA/revision and provider target in the release evidence ledger before claiming production freeze.

Record the output in `docs/URAI_STUDIO_RELEASE_EVIDENCE.md` and `docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md` before claiming production freeze.

## Environment variables

Copy `.env.example` for application configuration only. Public frontend values use `NEXT_PUBLIC_*`. Provider identity is supplied separately through Google Application Default Credentials / managed runtime identity, or through protected GitHub OIDC + Workload Identity Federation.

Common application values include:

```bash
NEXT_PUBLIC_SITE_URL=https://www.uraistudio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
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
```

Provider/service credentials must not be placed in `.env` files or repository configuration. `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` paired with key material, `FIREBASE_SERVICE_ACCOUNT_KEY`, raw/base64 service-account JSON, `credentials_json`, and `FIREBASE_TOKEN` are forbidden as Studio deployment/runtime authority. Missing ADC/WIF identity is a blocker, not a reason to introduce a long-lived key.

Provider-native application secrets, if a future governed feature requires them, must remain in protected provider secret storage and must not be printed or retained in CI evidence.

## Deployment notes

- Firebase Studio should not auto-start emulators during workspace boot.
- Source CI uses the frozen lockfile and exact candidate SHA.
- Production/provider mutation requires protected WIF/ADC identity, exact target verification, required independent approval, exact deployed-revision readback, monitoring/recovery evidence, and a distinct rollback revision.
- Do not use a local Firebase token, service-account key, or ad hoc deploy command to bypass the protected release path.
