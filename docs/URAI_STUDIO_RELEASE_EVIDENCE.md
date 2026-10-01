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

### Authority rule

This document MUST NOT hard-code its own containing commit as the current Studio authority. Editing this ledger creates a new commit, so any self-declared "current SHA" inside the file becomes stale at the moment the edit lands.

The authoritative current Studio source SHA is therefore resolved from the live GitHub head of PR #114 (`release/studio-terminal-candidate-20260924`) at verification time.

Likewise, cross-repository exact heads for Jobs and Spatial are resolved from the live GitHub heads of their governed PRs at verification time. This ledger may retain historical receipts, but it must not convert an observed external SHA into permanent current authority.

### Historical exact-head proof retained

The following receipts remain valid historical source evidence for their exact predecessor Studio SHA only:

- predecessor Studio SHA `de24d0fe38735d761d1a36e9971f03ea8d6cc108`
- Studio CI — run `36035410442`
- Studio Visual Proof — run `36035410581`
- Studio Audit — run `36035410633`
- Studio Health Guard — run `36035410443`
- URAI Production Verify — run `36035410530`
- URAI Studio Video Factory Verification — run `36035410453`
- source artifact `10825385628` — `sha256:7051325c1739ee30df276c4d049c57471aa5696635df7205a324ea49156d1055`
- visual artifact `10824241635` — `sha256:952963250a1ce55fe4a3a9478e50fe36cfe2159b8e5757175f0dc9f11c6d0a1c`
- video-factory artifact `10824356010` — `sha256:c9647d5b32eaf25cbc917238c771f0b90e72f484fb900eab6215c85db37c2512`

Those receipts prove only that predecessor SHA. They do not transfer to the current PR #114 head or any later successor.

### Current verification procedure

Before any merge or release decision:

1. Resolve the live PR #114 head from GitHub.
2. Require all governed Studio workflows to be terminal-successful on that exact SHA.
3. Retain artifact IDs/digests produced for that exact SHA.
4. Resolve the live governed Jobs PR and Spatial Studio-handoff PR heads from GitHub.
5. Verify their required exact-head proof independently.
6. Require genuine current independent human approval where governance requires it.
7. Re-check that no reviewed head changed before merge.
8. After merge, prove exact-main verification separately.
9. Treat deployment, live runtime, provider execution, paid spend, public release and XR activation as separate evidence classes.

### Gate classification

| Gate | Required proof | Classification rule |
| --- | --- | --- |
| Install / lint / typecheck / tests / app build / Functions build | terminal-successful exact-head workflow evidence | SOURCE only |
| Done-done / evidence / health guards | terminal-successful exact-head guard evidence | SOURCE only |
| Visual proof | retained exact-head visual artifact | SOURCE / presentation evidence only |
| Video-factory proof | retained exact-head video-factory artifact | SOURCE / artifact evidence only |
| Provider-backed execution | protected provider execution receipt | separate provider proof |
| Paid provider spend | explicit spend authority + provider receipt | separately authorized only |
| Firebase deployment | protected deployment output tied to merged exact SHA | deployment proof |
| Live-domain equivalence | runtime/deployment SHA readback + route smoke | live proof |
| Independent review | genuine APPROVED review bound to unchanged exact head | human governance proof |
| Public release | approved release action + source/review/deploy/live evidence | separately authorized only |

### Cross-repository authority rule

- Jobs authority is resolved from the live governed URAI Jobs terminal PR at verification time.
- Studio-Spatial consumer authority is resolved from the live governed Spatial Studio-Spatial handoff PR at verification time.
- Their predecessor receipts remain historical provenance only.
- No Jobs or Spatial approval, artifact, deployment or live evidence transfers across a changed SHA.
- Moving Spatial visual/runtime authority must be inherited by the handoff branch without replaying stale visual/runtime files.

### Activation classification

The following remain **HARD-OFF / NOT AUTHORIZED** unless separately governed:

- paid provider execution;
- provider generation;
- public publishing;
- external delivery;
- live XR;
- product-capture self-promotion;
- Film Foundry execution;
- Brain Map private operational activation;
- Life Movies production render dispatch;
- production V3 migration;
- future marketplace.

The following remain distinct **EXTERNAL / HUMAN / DEPLOYMENT GATES** until separately proven:

- independent exact-head human approval;
- protected merge into `main`;
- exact-main verification;
- protected Firebase deployment;
- live-domain exact-SHA equivalence;
- repository branch-protection administration.

No source-green state alone satisfies those gates.

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

PR #114 remains the single Studio release-candidate lane, but its exact current SHA must be resolved live from GitHub rather than hard-coded into this file.

This ledger preserves exact historical receipts while preventing self-invalidating current-SHA claims and stale cross-repository authority. Every successor SHA must earn its own machine proof and human approval.

Provider execution, paid spend, protected deployment, live-domain equivalence, merge, public release, live XR and production migration remain separate gates.
