# URAI Studio repo cleanup inventory

This inventory supports issue #27.

## Canonical production source

The production app root is `apps/studio`.

Canonical active application roots:

- `apps/studio/app`
- `apps/studio/components`
- `apps/studio/lib`
- `functions/src`

The root TypeScript alias now resolves `@/*` to `apps/studio/*`, and the done-done guard scans those canonical roots rather than the deleted duplicate `apps/studio/src` tree.

## Completed cleanup in PR #105

Removed from the active branch:

- complete `apps/studio/src/` duplicate tree;
- root `src/components/studio/JobStatePill.tsx`;
- root `src/components/studio/StudioShell.tsx`;
- root `src/lib/firebaseClient.ts`;
- root `src/lib/studioTypes.ts`.

These paths were either explicitly excluded by the canonical Studio tsconfig or disconnected from current active imports.

## Intentionally retained

| Path | Classification | Rule |
| --- | --- | --- |
| `archive/` | historical evidence only | never patch or deploy as production source |
| `apps/docs` | separate docs workspace | not a competing Studio runtime |
| `brain-map-ui/` | research/reference | governed Brain Map implementation belongs in canonical Studio contracts |
| `src/urai-foundation/wave1-foundation.js` | historical Foundation Wave 1 evidence | retained because current history docs reference it; not Studio production runtime |
| `_audit/` | historical audit evidence | not runtime authority |

Historical backup/deprecated app trees that previously existed as active roots are contained under `archive/`; they are not production roots.

## Superseded cleanup candidates

The old inventory referenced active `uraistudio-app`, `studio`, `tmp`, `--typescript`, timestamped backup trees, and `apps/studio/src/app/API_DISABLED_FOR_STATIC_EXPORT.md`. At the current #98-derived authority these are either already archived/absent or removed with the duplicate tree. They must not be revived as current source without a new reviewed architecture decision.

## Verification gate

Do not close issue #27 from source edits alone.

The cleanup successor must pass:

```bash
pnpm install --frozen-lockfile
pnpm release:check
HOST=http://127.0.0.1:3000 EXPECT_READY=false bash scripts/smoke.sh
```

and receive normal review/merge authority.

Git history remains available; removal from the active branch is not erasure of historical evidence.
