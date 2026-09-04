# URAI Studio Release Evidence Ledger

Date opened: 2026-06-16  
Repository: `LifeLoggerAI/urai-studio`  
Status: evidence ledger opened; source, provider, deployment, and live proof remain separate

## Purpose

This is the release-proof ledger for URAI Studio. It prevents source-green checks, fallback behavior, planned files, provider configuration, deployment, and live operation from being collapsed into one unsupported “done” claim.

Every machine-readable receipt must validate against `docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json` and bind to an exact 40-character commit SHA and one environment.

## Evidence boundaries

### Source-only release check

`pnpm release:check`

This credential-free check covers repository guards, schema boundaries, lint, typecheck, tests, Studio smoke contracts, the app build, and the Functions build. Passing it proves source integrity at the tested SHA. It does not prove deployment or a playable MP4, provider execution, protected Firebase configuration, IAM, DNS, monitoring, rollback, or a live URL.

### Provider-backed release check

`pnpm release:check:provider`

This runs the strict provider gate before the full source-only release check. It fails closed unless the configured Asset Factory, Spatial, Analytics, Content, and generation-provider environment variables are present. Passing configuration checks still does not prove a successful paid provider request, binary artifact generation, deployment, or live operation; those require retained execution receipts.

### Binary artifact boundary

`pnpm video-factory:render-artifacts`

The contract-only artifact command writes the deterministic JSON manifest, SRT captions, and a machine-readable `binary-render-receipt.json` with `status: not-rendered` and `playable: false`. It never writes or represents a playable MP4. A playable video requires the Playwright plus FFmpeg composition path and an independently verified binary receipt.

## Current repo-side proof

- Canonical app root: `apps/studio`.
- Canonical backend root: `functions`.
- Firebase Hosting points at `apps/studio`.
- Firebase Functions source points at `functions`.
- Root scripts expose source-only and strict provider-backed release checks.
- The evidence schema requires exact SHA, environment, provider readiness, and binary-artifact status.
- The done-done guard rejects internal placeholder/debug/test labels from user-facing source.
- The local artifact writer produces a non-playable receipt instead of a fake MP4 marker.
- `functions/src/index.ts` exports the Studio backend modules.
- `docs/URAI_STUDIO_FULL_AUDIT.md` records historical completion state and remaining blockers.

## Source and protected evidence ledger

| Gate | Required command or proof | Current classification | Evidence location |
| --- | --- | --- | --- |
| Install | `corepack prepare pnpm@9.7.0 --activate && pnpm install --frozen-lockfile` | Not run at current exact head | Exact-head CI or terminal receipt required |
| Lint | `pnpm lint` | Not run at current exact head | Exact-head CI or terminal receipt required |
| Typecheck | `pnpm typecheck` | Not run at current exact head | Exact-head CI or terminal receipt required |
| Unit/tests | `pnpm test` | Not run at current exact head | Exact-head CI or terminal receipt required |
| App build | `pnpm build` | Not run at current exact head | Exact-head CI or terminal receipt required |
| Functions build | `pnpm --dir functions build` | Not run at current exact head | Exact-head CI or terminal receipt required |
| Done-done guard | `pnpm done-done:guard` | Not run at current exact head | Exact-head CI or terminal receipt required |
| Evidence contract guard | `pnpm release:evidence:contract` | Not run at current exact head | Exact-head CI or terminal receipt required |
| Release receipt guard | `RELEASE_EVIDENCE_FILE=<receipt.json> pnpm release:evidence:guard` | Not run at current exact head | A concrete exact-head receipt is mandatory; omission fails closed |
| Source-only release check | `pnpm release:check` | Not run at current exact head | Exact-head CI or terminal receipt required |
| Provider-backed release check | `pnpm release:check:provider` | Protected / credential-gated | Provider configuration and execution receipts required |
| Binary artifacts | Playwright plus FFmpeg composer and playable-media validation | Protected / not proven | Binary hash, codec/probe, duration, frame, audio, and playback receipts required |
| Local smoke | `HOST=http://127.0.0.1:3000 pnpm studio:smoke` | Not run at current exact head | Exact-head CI or terminal receipt required |
| Firebase deployment | Protected Firebase deploy output | Not authorized in source phase | Deployment receipt required |
| Live smoke | Approved Studio live URL | Not authorized in source phase | Route, auth, console, network, and rollback proof required |

## Non-negotiable release rules

- Do not claim live production status until protected deployment and live smoke gates are recorded.
- Do not claim provider-backed generation from environment configuration alone.
- Do not claim a playable MP4 from a manifest, captions file, planned path, or non-playable receipt.
- Do not claim full V1 through V5 system status from Studio alone.
- Do not claim Spatial, XR, AR, VR, WebXR, billing, analytics, or Passport readiness unless the owning repository also has current evidence.
- Do not mark demo, scaffold, fallback-only, mocked, queued, planned, or not-rendered behavior as live capability.

## Source-only terminal block

Run from the exact clean repository head:

```bash
set -euo pipefail

test -z "$(git status --porcelain --untracked-files=all)"
TARGET_SHA="$(git rev-parse HEAD)"
test "${#TARGET_SHA}" -eq 40

corepack prepare pnpm@9.7.0 --activate
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm done-done:guard
pnpm evidence:guard
pnpm release:evidence:contract
pnpm release:check
HOST=http://127.0.0.1:3000 pnpm studio:smoke
```

After generating any source, provider, artifact, deployment, or live receipt, validate that concrete file with `RELEASE_EVIDENCE_FILE=<receipt.json> pnpm release:evidence:guard`; the receipt guard fails closed when the file is omitted. Run `pnpm release:check:provider` only in an approved protected environment. Do not paste or retain secret values in evidence.

## Current conclusion

URAI Studio has meaningful source foundations and explicit truth boundaries. It is not provider-certified, deployed, independently live-verified, or production-frozen until the protected rows above have exact-head receipts.
