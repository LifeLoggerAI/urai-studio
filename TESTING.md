# URAI Studio Testing

## Required Verification Commands

Run these from the repository root:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
pnpm studio:smoke
```

## Smoke Test

`pnpm studio:smoke` runs `scripts/studio-smoke-test.js` and verifies:

- Required repository files exist.
- Studio callable exports exist in `functions/src/studio-system.ts`.
- Firestore rules include the required Studio collections.
- Storage rules include required Studio paths.

## Manual QA Checklist

- Open `/`.
- Open `/studio`.
- Confirm Studio routes render without broken imports.
- Authenticate with Firebase Auth or emulator auth.
- Call `ping`.
- Call `seedStudioDemo`.
- Confirm created project, scenes, assets, narrator script, scroll, and export job documents.
- Call `createExportJob` and `processExportJob`.
- Confirm export job becomes `ready` and contains a manifest.
- Confirm Firestore rules prevent access to another user's Studio docs.
- Confirm Storage rules prevent cross-user uploads and reads.

## Known Limitation

Callable smoke checks require Firebase client configuration and an emulator or deployed project. The included smoke test is static by default and can be extended for live callable checks.
