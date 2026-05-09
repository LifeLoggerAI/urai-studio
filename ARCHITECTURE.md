# URAI Studio Architecture

## Canonical production app

The canonical production application is `apps/studio`.

Firebase Hosting is configured from the repository root, and `firebase.json` points the hosting source at `apps/studio`.

## Runtime surfaces

- Public website routes live in `apps/studio/app`.
- System API routes live in `apps/studio/app/api/system`.
- Liveness is exposed at `/healthz`.
- Readiness is exposed at `/readyz`.
- Public form APIs are `/api/waitlist` and `/api/contact`.
- The canonical module registry is `apps/studio/lib/studio/modules.ts`.
- The readiness model is `apps/studio/lib/studio/status.ts`.
- Firebase Admin persistence is initialized in `apps/studio/lib/firebase-admin.ts`.

## Non-canonical historical trees

The repository has historical or duplicate app roots and backup material. These paths must not be edited as production source unless this document is updated in the same pull request.

If useful code is recovered from a historical tree, migrate the code into `apps/studio` and describe the migration in the pull request.

## Release gates

A release is not ready unless these commands pass from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

Local HTTP smoke must pass against a running local server:

```bash
HOST=http://127.0.0.1:3000 EXPECT_READY=false bash scripts/smoke.sh
```

Production HTTP smoke must pass after deployment:

```bash
HOST=https://www.uraistudio.com EXPECT_READY=true bash scripts/smoke.sh
```

Production `/readyz` must return `200` before public launch.
