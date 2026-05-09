# URAI Studio Testing

## Required Verification Commands

Run these from the repository root in a network-enabled checkout:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions install --no-frozen-lockfile
pnpm --dir functions build
pnpm studio:smoke
```

Do not create `LOCK.md`, deploy broadly, or claim the repo is verified until the install, lint, typecheck, app build, functions build, tests, and smoke check pass in CI, Firebase Studio, Codespaces, or a local checkout.

## GitHub Actions

The workflow at `.github/workflows/studio-audit.yml` is expected to run the audit chain for pushes and manual dispatch. Review workflow logs before release lock.

## Static Smoke Test

`pnpm studio:smoke` runs `scripts/studio-smoke-test.js` and verifies the static contract surface, including:

- Required repository files exist.
- Studio callable exports exist in `functions/src/studio-system.ts`.
- Functions use Firebase Functions v2 callable APIs.
- `functions/src/index.ts` exports the Studio system module.
- Studio frontend callable controls reference real callable client functions.
- Public and Studio route pages include expected metadata/canonical declarations.
- System health, manifest, capabilities, OpenAPI, integrations, readiness, and liveness API routes exist and expose hardened response tokens.
- Contact and waitlist submission APIs validate input, use no-store responses, and write only through Firebase Admin/server routes.
- Firestore rules include required Studio collections and explicitly deny client SDK access to `waitlist` and `contactMessages`.
- Storage rules include owner-only uploads, server-generated outputs, public read-only assets, and membership-gated studio upload/output paths.
- `FIREBASE.md` documents public submission collections and Storage rule semantics.
- CI workflow includes lint, typecheck, app build, functions build, and smoke check commands.

## Manual QA Checklist

- Open `/`.
- Open `/studio`.
- Open `/studio/projects`, `/studio/assets`, `/studio/exports`, `/studio/admin`, `/studio/settings`, and `/studio/xr`.
- Open `/dashboard`, `/usage`, `/integrations`, `/settings`, `/admin`, `/analytics`.
- Open `/privacy`, `/terms`, `/contact`, `/waitlist`, `/demo`, `/status`, `/systems`, and `/system`.
- Confirm routes render without broken imports.
- Confirm public pages do not claim unavailable services are live.
- Submit invalid waitlist/contact payloads and confirm validation errors.
- Submit valid waitlist/contact payloads in emulator or configured Firebase Admin environment and confirm documents are written to `waitlist` / `contactMessages` only through server routes.
- Authenticate with Firebase Auth or emulator auth.
- Call `ping`.
- Call `seedStudioDemo`.
- Confirm created project, scenes, assets, narrator script, scroll, and export job documents.
- Call `createExportJob` and `processExportJob`.
- Confirm export job becomes `ready` and contains a manifest.
- Confirm Firestore rules prevent access to another user's Studio documents.
- Confirm Firestore rules deny client SDK access to `waitlist` and `contactMessages`.
- Confirm Storage rules prevent cross-user uploads and reads.
- Confirm generated and public asset paths deny client writes.

## Known Limitations

- Callable smoke checks require Firebase client configuration and an emulator or deployed project. The included smoke test is static by default.
- This environment could not run the full verification chain because dependency install/build requires a network-enabled checkout.
- `LOCK.md` must not be added until the full verification command set passes.
