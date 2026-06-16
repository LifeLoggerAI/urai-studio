# URAI Studio Progress Note

Date: 2026-06-16
Repository: `LifeLoggerAI/urai-studio`
Status: repo-side completion progress, not live deploy proof

## Changes landed

- Added `docs/URAI_STUDIO_FULL_AUDIT.md`.
- Replaced `apps/studio/README.md` starter copy with a Studio-specific app runbook.
- Added `apps/studio/lib/studio-spatial-handoff.ts`.
- Added `apps/studio/tests/studio-spatial-handoff.test.mjs`.
- Wired the handoff regression test into `apps/studio/tests/all.test.mjs`.

## Why this matters

The Studio-to-Spatial boundary now has a typed fallback-first manifest. The default runtime matrix keeps fallback web output verified while keeping advanced spatial runtimes behind release evidence. That prevents Studio from accidentally presenting future runtime targets as production-ready before downstream verification exists.

## What this does not prove

This note does not claim that install, lint, typecheck, tests, build, Firebase deploy, or live smoke passed. Those still need to be run from a terminal or CI environment and recorded as release evidence.

## Next safest implementation steps

1. Wire the handoff manifest into the real export creation path.
2. Add a validator that rejects unsafe or unscoped manifests.
3. Add tenant and ownership tests around export status, download, dashboard, and admin flows.
4. Replace placeholder generation/export outputs with feature-gated provider adapters or verified fallback behavior.
5. Run and record the full release gate.

## Release gate to record

```bash
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

After deploy:

```bash
HOST=https://www.uraistudio.com bash scripts/smoke.sh
```
