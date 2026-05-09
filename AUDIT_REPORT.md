# URAI Studio Audit Report

## Scope

This audit implemented the requested system-of-systems enforcement layer for `urai-studio`.

## Current Findings

- The repository is a pnpm monorepo.
- The root package delegates app work to the `studio` package.
- Firebase Hosting points at `apps/studio`.
- Firebase Functions are under `functions`.
- Existing Studio pages and functions were present before this pass.

## Implemented in This Pass

- Added URAI Studio callable functions in `functions/src/studio-system.ts`.
- Exported the callable functions from `functions/src/index.ts`.
- Expanded Firestore rules for user-owned Studio collections.
- Expanded Storage rules for uid-scoped uploads, generated files, and public Studio assets.
- Added Firestore indexes for projects, assets, scenes, scrolls, and exports.
- Added `.env.example`.
- Added `scripts/studio-smoke-test.js`.
- Added `studio:smoke` to the root package scripts.
- Added functions build/typecheck scripts.

## Important Limitation

The GitHub connector can write files, but this environment cannot clone GitHub or install packages from the network. Real command execution still needs to be run in GitHub Actions, a local checkout, Firebase Studio, or another environment with repo and package access.
