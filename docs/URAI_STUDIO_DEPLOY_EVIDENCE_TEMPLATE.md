# URAI Studio Deploy Evidence Template

This template is for recording proof after a real deployment and remote endpoint check. It is intentionally empty until an operator or CI job fills it with actual values.

## Commit

- Repository: `LifeLoggerAI/urai-studio`
- Branch: `main`
- Commit SHA: `[fill after deploy]`
- Commit title: `[fill after deploy]`

## Local or CI checks

Record the exact result for each command.

- `pnpm install`: `[pass/fail + link/log]`
- `pnpm audit`: `[pass/fail + link/log]`
- `pnpm release:check`: `[pass/fail + link/log]`

## Hosting target

- Hosting provider/project: `[fill after deploy]`
- Site or service name: `[fill after deploy]`
- Base URL: `[fill after deploy]`
- Deployed at UTC: `[fill after deploy]`

## Remote endpoint checks

Record status code, response summary, and evidence link/log for each endpoint.

- `/api/system/health`: `[status + evidence]`
- `/api/system/manifest`: `[status + evidence]`
- `/api/system/spatial-handoff`: `[status + evidence]`
- `/api/studio/exports`: `[status + evidence]`

## Required response facts

Do not mark complete unless these facts are observed from the remote responses.

- Health response includes `integrationSummary`.
- System manifest includes `spatialHandoff`.
- Spatial handoff response is fallback-safe by default.
- Studio exports response includes `spatialHandoff`.
- No unsupported XR, biometric, provider-sync, or production-live claim is added without proof.

## Result

- Deployment proof status: `[not recorded / recorded]`
- Remote smoke status: `[not recorded / passed / failed]`
- Notes: `[fill after deploy]`
