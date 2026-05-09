# URAI Studio repo cleanup inventory

This inventory supports issue #27. It is intentionally non-destructive: it records cleanup candidates before files or trees are removed.

## Canonical production source

The production app root is `apps/studio`.

Firebase Hosting points to `apps/studio` through `firebase.json`. Public website routes, system APIs, readiness/liveness probes, form handlers, and launch documentation should be maintained in `apps/studio` unless the architecture changes in a reviewed PR.

## Confirmed cleanup candidates

These paths should be reviewed before public launch. Each item needs one of three decisions: keep as production source, migrate useful code into `apps/studio`, or remove/archive from the active branch.

| Path or pattern | Current concern | Suggested decision |
|---|---|---|
| `apps/studio/src/app` | Duplicate App Router tree parallel to `apps/studio/app`. Search results show pages and API disabled notes under this tree. | Inventory files, migrate any missing value into `apps/studio/app`, then remove from active branch. |
| `uraistudio-app` | Historical app tree with routes, Firebase files, admin/user pages, jobs, outputs, share/project pages. | Treat as non-canonical. Migrate only explicitly needed code into `apps/studio`. |
| `studio` | Historical app tree with overlapping Studio routes. | Treat as non-canonical unless a maintainer identifies a live deployment dependency. |
| `tmp` | Temporary lock/freeze scripts found in repository search. | Remove from active branch after confirming no CI/deploy dependency. |
| `scripts/local` | Local one-off ship/fix/redeploy scripts found in repository search. | Move durable commands into documented scripts or remove one-off local scripts. |
| root `urai-studio-lock.sh` | Root-level lock script separate from canonical scripts. | Confirm whether superseded by `scripts/lock_urai_studio.sh`; remove if stale. |
| `_audit` | Generated audit/proof artifacts. Useful for history, but noisy in source tree. | Keep only if intentionally used as release evidence; otherwise move to release notes or archive branch. |
| timestamped `.bak` files | Backup snapshots should not live in active source. | Remove after confirming no unique code needs migration. |
| `.bak` folders | Backup snapshots should not live in active source. | Remove after confirming no unique code needs migration. |
| `--typescript` | Looks like generated or accidentally named app scaffold. | Review, migrate anything useful, then remove if non-canonical. |
| `apps/studio/app/API_DISABLED_FOR_STATIC_EXPORT.md` | Static-export note may be stale now that the app uses runtime APIs/readiness. | Confirm whether still accurate; update or remove. |
| `apps/studio/src/app/API_DISABLED_FOR_STATIC_EXPORT.md` | Same concern, also in duplicate tree. | Remove with duplicate tree if no longer needed. |

## Required review steps before deletion

1. List files under each candidate path.
2. Compare route/API coverage against `apps/studio/app`.
3. Identify any unique production behavior not yet migrated.
4. Migrate useful code into canonical files with tests.
5. Remove stale paths in a dedicated cleanup PR.
6. Run:

```bash
pnpm install --frozen-lockfile
pnpm release:check
HOST=http://127.0.0.1:3000 EXPECT_READY=false bash scripts/smoke.sh
```

## Launch gate

This cleanup does not have to block internal development, but public launch should not proceed until either:

- the cleanup is complete, or
- the remaining non-canonical paths are explicitly accepted as a documented launch risk.
