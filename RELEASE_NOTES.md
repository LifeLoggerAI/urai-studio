# URAI Studio Release Notes

## System Audit Implementation Pass

### Added

- URAI Studio callable functions for projects, demo seeding, scripts, subtitles, assets, exports, dashboard summaries, and events.
- Firestore rules for user-owned Studio collections.
- Storage rules for uid-scoped Studio uploads and generated outputs.
- Firestore indexes for Studio project, asset, scene, scroll, and export queries.
- Static Studio smoke test script.
- `.env.example`.
- System map, audit, Firebase, testing, and handoff documentation.

### Changed

- Root `audit` script now includes `pnpm studio:smoke`.
- Functions package now has `build` and `typecheck` scripts.
- Functions index exports the Studio system callable module.

### Verification Status

Not release-locked. The GitHub connector committed files, but this environment could not clone the repo or install dependencies because outbound GitHub network access is unavailable from the execution container.

### Required Before Release

Run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
pnpm studio:smoke
```
