# URAI Studio

Creator and admin studio for URAI: public site, cinematic AI studio surfaces, Firebase-backed contact and waitlist flows, system diagnostics, and launch-ready module pages.

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

The preview script runs the Studio app under `apps/studio` on the configured port.

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
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm studio:smoke
pnpm --dir functions build
```

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
NEXT_PUBLIC_URAI_MARKETING_URL=
NEXT_PUBLIC_URAI_ANALYTICS_URL=
NEXT_PUBLIC_URAI_ADMIN_URL=
NEXT_PUBLIC_URAI_PRIVACY_URL=
NEXT_PUBLIC_URAI_INVESTORS_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Deployment notes

- Firebase Studio should not auto-start emulators during workspace boot.
- `pnpm install --no-frozen-lockfile` is intentionally used while the dependency graph is being repaired and React/Next are aligned.
- Once CI is green and the lockfile is regenerated on a real workstation or CI repair run, switch the audit workflow back to frozen lockfile mode.
