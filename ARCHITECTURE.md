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


## Canonical-root hygiene

The active production source tree does not use a parallel `src/` application root.

As of the 2026-09-23 cleanup:

- `apps/studio/app`, `apps/studio/components`, and `apps/studio/lib` are the canonical Studio application roots.
- `apps/studio/src` was removed because `apps/studio/tsconfig.json` explicitly excluded it and the current application does not import it.
- disconnected root `src/components/studio` and `src/lib` duplicates were removed after repository search found no active imports.
- `archive/` remains intentionally retained as historical evidence and is never production source.
- `apps/docs` is a separate documentation workspace package, not the Studio production application.
- `brain-map-ui` is retained as a research/reference artifact; current governed Brain Map contracts live under the canonical Studio control plane.
- `src/urai-foundation/wave1-foundation.js` is retained as historical Foundation-wave evidence referenced by `docs/URAI_STUDIO_WAVE1_POLISH_STATUS.md`; it is not a production Studio app root.

Any future code recovered from retained historical/reference areas must be migrated into a canonical active root and independently tested before use.
