# Firebase Studio recovery

Use this when Firebase Studio gets stuck on **Building environment** or asks you to launch the recovery environment.

## What this repo expects

- Node 20
- pnpm 9.7.0 through Corepack
- Next app source: `apps/studio`
- Firebase Hosting source: `apps/studio`
- Cloud Functions source: `functions`
- Optional Firebase App Hosting config at repo root: `apphosting.yaml`

## Recovery commands

Run these from the repository root inside Firebase Studio recovery:

```bash
git pull
pnpm run studio:repair
```

The repair script bootstraps pnpm if needed, removes stale install/build artifacts, installs dependencies, builds the Studio app, and runs the static smoke test.

If the repair script fails before pnpm is available, run the bootstrap manually:

```bash
corepack enable || true
corepack prepare pnpm@9.7.0 --activate || npm i -g pnpm@9.7.0
pnpm install --no-frozen-lockfile
pnpm --filter studio build
pnpm studio:smoke
```

## Start the Studio preview

```bash
pnpm run studio:preview
```

Equivalent direct command:

```bash
pnpm -C apps/studio dev -- --hostname 0.0.0.0 --port 3000
```

## Start emulators only after the workspace boots

Do not auto-start Firebase emulators during workspace startup. Start them manually after install/build succeeds:

```bash
pnpm run firebase:emulators
```

Equivalent direct command:

```bash
npx firebase emulators:start --only auth,firestore,storage,functions,hosting
```

## CI and lockfile note

The audit workflow intentionally uses `pnpm install --no-frozen-lockfile` while the Studio workspace is being repaired. This lets pnpm regenerate dependency metadata after React/Next alignment changes. Once the workspace is stable, the workflow can be switched back to `pnpm install --frozen-lockfile`.

## Why this matters

Firebase Studio can appear stuck when the workspace attempts to build the Nix environment, install packages, and start long-running emulators at the same time. This repo keeps the startup path small and moves emulators to an explicit manual step.
