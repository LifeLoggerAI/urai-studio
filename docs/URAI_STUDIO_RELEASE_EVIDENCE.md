# URAI Studio Release Evidence Ledger

Date opened: 2026-06-16
Repository: `LifeLoggerAI/urai-studio`
Status: evidence ledger opened, not production-complete proof

## Purpose

This file is the release proof ledger for URAI Studio. It separates real proof from claims so the repo cannot be marked done-done until the app, backend, deployment, and live URL are verified.

## Current repo-side proof

- Canonical app root: `apps/studio`.
- Canonical backend root: `functions`.
- Firebase Hosting points at `apps/studio`.
- Firebase Functions source points at `functions`.
- Root scripts include lint, typecheck, test, build, smoke, audit, release check, and done-done guard commands.
- `functions/src/index.ts` exports the Studio backend modules.
- `docs/URAI_STUDIO_FULL_AUDIT.md` records the current completion state and remaining blockers.
- `apps/studio/README.md` now documents the Studio app root instead of generic starter copy.

## Evidence still required before production lock

The following boxes must be filled with real terminal, CI, deploy, or live smoke output before anyone can honestly claim Studio is production done-done.

| Gate | Required command or proof | Result | Evidence location |
| --- | --- | --- | --- |
| Install | `corepack prepare pnpm@9.7.0 --activate && pnpm install --no-frozen-lockfile` | Pending | Pending |
| Lint | `pnpm lint` | Pending | Pending |
| Typecheck | `pnpm typecheck` | Pending | Pending |
| Unit/tests | `pnpm test` | Pending | Pending |
| App build | `pnpm build` | Pending | Pending |
| Functions build | `pnpm --dir functions build` | Pending | Pending |
| Done-done guard | `pnpm done-done:guard` | Pending | Pending |
| Release check | `pnpm release:check` | Pending | Pending |
| Local smoke | `HOST=http://127.0.0.1:3000 pnpm studio:smoke` | Pending | Pending |
| Firebase deploy | Firebase deploy output for hosting/functions | Pending | Pending |
| Live smoke | `HOST=https://www.uraistudio.com bash scripts/smoke.sh` | Pending | Pending |

## Non-negotiable release rules

- Do not claim live production status until the live smoke gate is recorded.
- Do not claim provider-backed generation until provider execution and artifact proof are recorded.
- Do not claim full V1 through V5 system status from Studio alone.
- Do not claim Spatial, XR, AR, VR, WebXR, billing, analytics, or Passport readiness unless the owning repo also has evidence.
- Do not mark placeholder, demo, scaffold, or mocked behavior as live capability.

## Terminal paste block

Run this from the repo root when the Firebase/terminal environment is available:

```bash
set -euo pipefail

corepack prepare pnpm@9.7.0 --activate
pnpm install --no-frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
pnpm done-done:guard
pnpm release:check
HOST=http://127.0.0.1:3000 pnpm studio:smoke
```

After deployment, run:

```bash
HOST=https://www.uraistudio.com bash scripts/smoke.sh
```

## Current conclusion

URAI Studio has meaningful repo-side foundation and audit locks. It is not yet production-frozen until the pending evidence rows above are completed and recorded.
