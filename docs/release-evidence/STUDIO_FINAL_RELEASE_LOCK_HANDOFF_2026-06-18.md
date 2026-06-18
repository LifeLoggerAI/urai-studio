# URAI Studio Final Release Lock Handoff — 2026-06-18

## Current repo truth

Repository: `LifeLoggerAI/urai-studio`

Default branch: `main`

Latest confirmed integration hardening merge: PR #42, `Ecosystem integration hardening: shared schema, XR handoff, failsafe docs`

Confirmed merge commit: `e474cfbad08d876e1ae7f9ee82f216331b0c7ed0`

The latest visible integration hardening added:

- `docs/contracts/URAI_ECOSYSTEM_SCHEMA_V1.json`
- `docs/contracts/URAI_ECOSYSTEM_INTEGRATION_V1.md`
- `docs/WEBXR_STUDIO_HANDOFF.md`
- `docs/FAILSAFE_DIAGNOSTICS.md`

## Final-product rule

This repo must not be called fully production locked until the current `main` head has fresh proof for all of the following gates on a clean runner or equivalent release machine:

```bash
corepack enable
corepack prepare pnpm@9.7.0 --activate
pnpm install --frozen-lockfile
pnpm audit
pnpm release:check
```

The aggregate release command is:

```bash
pnpm release:check
```

## What the gates prove

| Gate | Required proof |
| --- | --- |
| `pnpm audit` | Done-done guard, release evidence schema guard, health summary guard, lint, typecheck, app tests, and Studio smoke. |
| `pnpm release:check` | Full audit plus production Studio build and Firebase Functions build. |

## External/live boundaries

This repository is the Studio/creator pipeline surface. Final product claims still require live staging or production smoke evidence for:

- authenticated project creation
- Studio job creation and queue execution
- provider-backed generation, when enabled
- asset persistence and export/download flows
- tenant/user scoping
- billing/payment boundaries, if enabled
- Studio-to-Spatial handoff using the committed ecosystem contracts

The GitHub connector can read/write normal repo files, but it cannot execute Firebase deploys, browser runtime checks, or secret/billing-gated live commands. Therefore final live proof must be produced by CI or a release machine with the correct Node twenty runtime, pnpm nine point seven, Firebase auth, and required environment.

## Production call

Status as of this handoff: **repo release gates are defined, but full product lock is not claimable until `pnpm release:check` passes on current `main` and live Studio smoke evidence is recorded.**

Do not claim provider-backed generation, paid billing, live authenticated exports, or production Studio-to-Spatial delivery unless the matching gate has current release evidence.
