# URAI Studio App

Canonical app root: `apps/studio`
Framework: Next.js App Router
Package manager: pnpm `9.7.0`
Runtime target: Node `>=20 <21`

This is the production-facing URAI Studio web app. It is the public and authenticated Studio surface for cinematic AI campaign pages, Studio modules, project workflows, assets, jobs, exports, contact/waitlist flows, privacy/status pages, and system diagnostics.

## What belongs here

- Public Studio pages and routes.
- Authenticated Studio dashboard and project surfaces.
- Studio module UI.
- Client-safe Firebase usage.
- Public integration/status/manifest views.
- Shared app components used by the canonical Studio app.

## What does not belong here

- Firebase Admin credentials.
- Raw private user data.
- Provider secrets.
- Historical app roots from `uraistudio-app/**`, root `app/**`, or root `studio/**`.
- Claims that generation, billing, XR, or live cross-repo provider integrations are complete unless backed by deployment and smoke evidence.

## Run locally

From the repository root:

```bash
corepack prepare pnpm@9.7.0 --activate
pnpm install --no-frozen-lockfile
pnpm --filter studio dev
```

Or run directly from this app folder:

```bash
pnpm dev
```

Open `http://localhost:3000` unless a different port is configured by the environment.

## Required checks before calling this app release-ready

From the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
pnpm done-done:guard
pnpm release:check
```

Local smoke:

```bash
HOST=http://127.0.0.1:3000 bash scripts/smoke.sh
```

Production smoke after deploy:

```bash
HOST=https://www.uraistudio.com bash scripts/smoke.sh
```

## Canonical release boundary

The app can be described as a polished Studio shell and backend foundation when the app builds and smoke tests pass.

The app cannot be described as fully done-done until the repo has recorded proof for:

- clean dependency install
- lint
- typecheck
- tests
- Next build
- functions build
- done-done guard
- Firebase deploy
- live production smoke
- real generation provider behavior or explicit feature gates
- real export package/download behavior
- tenant-scoped dashboard, job, asset, export, and admin behavior

See `../../docs/URAI_STUDIO_FULL_AUDIT.md` and `../../docs/URAI_STUDIO_DONE_DONE_LOCK.md` for the current completion contract.
