# URAI Studio execution notes

Recorded: 2026-06-30

## Applied change

Updated `apps/studio/tests/routes-smoke.mjs` so linked Studio routes are covered by static route smoke expectations:

- `/generate`
- `/studio/video-factory`
- `/api/studio/video-factory`

Commit: `102412dbc32285bcd0289c9776cd8fd07bc6ab7f`

## Local runtime note

A local checkout was attempted from the assistant runtime, but the runtime could not resolve `github.com`. Because of that, install, lint, typecheck, tests, app build, Functions build, preview, and smoke were not executable from this session.

## Follow-up change recommended

Move public callable action controls off `/studio` and keep them behind the gated `/studio/admin` QA route or a fully authenticated Studio workspace. The public overview currently imports and renders the callable action panel.

## Required command receipts

Attach clean logs for:

```bash
pnpm install --no-frozen-lockfile
pnpm done-done:guard
pnpm evidence:guard
pnpm health:guard
pnpm provider:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
pnpm studio:smoke
```

READY remains blocked until those receipts and live deployment smoke are recorded.