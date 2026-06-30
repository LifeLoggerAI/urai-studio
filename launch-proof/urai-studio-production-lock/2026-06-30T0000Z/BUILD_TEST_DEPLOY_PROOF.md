# URAI Studio build/test/deploy proof log

Recorded: 2026-06-30

## Commands required for production lock

The repository declares the following release/audit command path:

```bash
corepack prepare pnpm@9.7.0 --activate
pnpm install --no-frozen-lockfile
pnpm done-done:guard
pnpm evidence:guard
pnpm health:guard
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
HOST=http://127.0.0.1:3000 pnpm studio:smoke
HOST=https://www.uraistudio.com bash scripts/smoke.sh
```

## This pass execution status

This connector session inspected GitHub repository contents and created proof files, but it did not have a live repository checkout/runtime terminal suitable for executing install, lint, typecheck, tests, build, Functions build, start/preview, or live smoke.

## Evidence collected

- Repository metadata confirmed for `LifeLoggerAI/urai-studio`.
- Default branch confirmed as `main`.
- Repository visibility confirmed as public.
- Admin/push permissions available in this connector session.
- Root package scripts define build/dev/lint/typecheck/test/smoke/audit/release paths.
- Canonical app package defines Next build/start/lint/typecheck/test/e2e routes.
- Firebase App Hosting configuration exists and sets `NEXT_PUBLIC_SITE_URL=https://www.uraistudio.com` with admin QA disabled by default.
- `firebase.json` points Hosting source to `apps/studio` and Functions source to `functions`.

## Evidence missing / not run

| Gate | Status |
|---|---:|
| install | NOT RUN in this pass |
| lint | NOT RUN in this pass |
| typecheck | NOT RUN in this pass |
| tests | NOT RUN in this pass |
| app build | NOT RUN in this pass |
| functions build | NOT RUN in this pass |
| preview/start | NOT RUN in this pass |
| local smoke | NOT RUN in this pass |
| live smoke | NOT RUN in this pass |
| current GitHub Actions green run | NOT FOUND in this pass |
| deployment target verification | CONFIG FOUND, LIVE PROOF MISSING |

## Production-lock consequence

Because current build/test/deploy proof is missing, URAI Studio cannot honestly be marked READY from this pass. It remains PARTIAL until a real terminal/CI run attaches clean logs for every gate above and the deployed URL is smoke-tested against the same commit.