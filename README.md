# URAI Studio

URAI Studio is the public and operator-facing web surface for URAI Studio at `https://www.uraistudio.com`.

## Canonical source of truth

The canonical production app root is:

```txt
apps/studio
```

Firebase Hosting is configured from the repository root with `firebase.json` pointing hosting source at `apps/studio` and functions source at `functions`.

Other historical app trees, backup folders, generated artifacts, and timestamped `.bak` files must not be treated as production source unless a maintainer explicitly promotes them. Clean them up or archive them before broad launch.

## Required toolchain

- Node.js 20+
- pnpm 9.7.0
- Firebase CLI for deploy/emulator workflows

Install from the repo root:

```bash
pnpm install --frozen-lockfile
```

## Local development

```bash
pnpm dev
```

The root `dev` script runs the canonical Studio app.

## Release validation

Run from the repository root before merging or deploying:

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

Start the app locally, then run real HTTP smoke:

```bash
pnpm dev
HOST=http://127.0.0.1:3000 EXPECT_READY=false bash scripts/smoke.sh
```

`EXPECT_READY=false` is appropriate for local/demo runs without production Firebase Admin persistence.

After production deploy:

```bash
HOST=https://www.uraistudio.com EXPECT_READY=true bash scripts/smoke.sh
```

## Production readiness semantics

- `/healthz` is a liveness probe. It should return `200` when the web process is alive.
- `/readyz` is a readiness probe. It should return `503` when required production dependencies are missing.
- `/api/system/health` is a diagnostic surface. It includes readiness, warnings, module statuses, integration configuration, and Firebase diagnostics.

Production launch must not proceed unless `/readyz` returns `200` on the deployed domain.

## Persistence requirements

Public forms must not fake success in production.

Required production persistence environment:

```txt
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_SITE_URL=https://www.uraistudio.com
```

Alternatively, deploy into a runtime with valid Google Application Default Credentials and `GOOGLE_APPLICATION_CREDENTIALS` available.

When Firebase Admin persistence is unavailable:

- production form submissions return `503`
- local/demo form submissions return `202` with `persisted:false`

## Deployment

1. Confirm Firebase project and hosting target.
2. Configure production environment variables/secrets.
3. Run `pnpm release:check`.
4. Deploy to staging if available.
5. Run smoke against staging.
6. Deploy production.
7. Run:

```bash
HOST=https://www.uraistudio.com EXPECT_READY=true bash scripts/smoke.sh
```

8. Record the command output in the release notes.

## Launch blockers

Do not publicly launch while any of these are true:

- duplicate app roots are still being edited as if they are production
- `pnpm install --frozen-lockfile` fails
- `pnpm release:check` fails
- local HTTP smoke fails
- production HTTP smoke fails
- `/readyz` is degraded in production
- waitlist/contact persistence is unavailable in production
- Privacy/Terms routes are missing or unlinked
- DNS/SSL for `www.uraistudio.com` is unverified
- analytics, monitoring, and error tracking are unverified

## Known follow-up work

- Complete cleanup or archival of stale duplicate app trees.
- Add CI job that starts the production build and runs `scripts/smoke.sh`.
- Add provider-specific analytics and error tracking verification.
- Add stronger abuse controls for public forms if launch traffic increases.
