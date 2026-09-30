# Studio review validation repair — 2026-09-27

Scope: three current review findings on Studio PR #118 at `ea4b64cb7ee5827dc024b397509ee1fada0fc66e`. Isolated descendant repair; no provider execution, spending, public release, or runtime activation.

## Reproduced original behavior

- `createLifeMovieProject` discarded a supplied relationship-arc theme and accepted missing narrative authority. POST used that constructor without forwarding either field.
- Captured Reality populated only with whitespace references and empty review/approval strings returned `ready: true` with no blockers.
- A dialogue-priority cue with NaN ducking bounds returned no validation errors.

## Repair

The constructor and POST retain narrative theme and authority. Existing narrative authority validation now receives the actual input. Captured Reality requires nonblank source references and checks every reconstruction, artifact, review, and approval reference before readiness. Dialogue ducking requires finite numeric bounds before range validation.

Behavioral regressions run real transpiled source modules, including POST with authentication and the hard-off feature boundary stubbed. They verify metadata retention, absent/blank narrative authority, the custom-theme exception, all eight reconstruction reference fields, empty/blank/mixed receipt arrays, valid ducking bounds, and NaN/positive-infinity/negative-infinity rejection. The valid POST still returns hard-off 409; invalid authority returns 400 before any persistence or dispatch.

## Validation receipt

- `corepack pnpm --filter studio test`: PASS, 75 regression files, 27 node:test cases, zero failures.
- `corepack pnpm --filter studio typecheck`: PASS.
- `git diff --check`: PASS.
- Installed the unchanged frozen lockfile using pnpm 9.7.0. Local Node was 24.19.0, so this is not a substitute for pinned CI runtime proof. Root script shorthand encountered the global pnpm 11 engine mismatch; direct pinned filter commands above completed successfully.

## Certification boundary

These are local implementation receipts. Exact published-head CI and independent review remain required. No deployed runtime, reconstruction artifact, likeness, music output, or public release is certified by this change.
