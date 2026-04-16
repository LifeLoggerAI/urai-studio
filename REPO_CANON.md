# URAI Studio Repo Canon

## Authoritative structure

This repository is a **pnpm monorepo**.

### Frontend source of truth
- `apps/studio`
- Package name: `studio`
- Local dev from repo root: `pnpm dev`
- Firebase Hosting source: `apps/studio`

### Backend source of truth
- `functions`
- Firebase Functions source: `functions`

### Workspace root responsibilities
- pnpm workspace coordination
- shared scripts
- emulator entrypoint
- repo-level typecheck/build/lint orchestration

## Non-canonical / legacy content
The following content is not authoritative and should not be treated as active app ownership:
- `uraistudio-app/` legacy standalone Next app
- tracked backup artifacts such as `*.bak.*`
- tracked `.bak/` snapshots
- tracked `tmp/` operational scratch scripts and generated files

## Canon rules
1. Do not introduce a second standalone app outside `apps/*` without explicit monorepo registration.
2. Do not commit backup artifacts (`*.bak.*`, `.bak/`) or scratch temp content (`tmp/`).
3. Frontend deployment ownership stays with `apps/studio` unless Firebase config is intentionally changed.
4. Backend deployment ownership stays with `functions` unless Firebase config is intentionally changed.
5. Root scripts must delegate to workspace packages rather than duplicate app logic.

## Stage 1 cleanup intent
Stage 1 canonicalization removes or quarantines legacy duplicate app content and tracked backup/temp debris while preserving:
- `apps/studio`
- `functions`
- `firebase.json`
- root workspace orchestration
