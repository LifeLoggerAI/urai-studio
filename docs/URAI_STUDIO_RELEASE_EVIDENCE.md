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

Current terminal source-control authority: Studio PR #114 exact head `de24d0fe38735d761d1a36e9971f03ea8d6cc108`.

This exact head supersedes the predecessor Studio stack as the single current review target. No predecessor review, deployment, live-runtime, provider, or release evidence transfers automatically.

Current exact-head pull-request workflows completed successfully:

- Studio CI — run `36035410442`
- Studio Visual Proof — run `36035410581`
- Studio Audit — run `36035410633`
- Studio Health Guard — run `36035410443`
- URAI Production Verify — run `36035410530`
- URAI Studio Video Factory Verification — run `36035410453`

Retained exact-head artifacts:

- `studio-source-evidence-de24d0fe38735d761d1a36e9971f03ea8d6cc108` — artifact `10825385628` — `sha256:7051325c1739ee30df276c4d049c57471aa5696635df7205a324ea49156d1055`
- `urai-studio-visual-de24d0fe38735d761d1a36e9971f03ea8d6cc108` — artifact `10824241635` — `sha256:952963250a1ce55fe4a3a9478e50fe36cfe2159b8e5757175f0dc9f11c6d0a1c`
- `urai-studio-video-factory-evidence` — artifact `10824356010` — `sha256:c9647d5b32eaf25cbc917238c771f0b90e72f484fb900eab6215c85db37c2512`

These receipts prove source/workflow state only. They do not prove protected deployment, live-domain exact-SHA equivalence, independent human approval, provider execution, paid spend, public release, or live XR.

| Gate | Required command or proof | Current classification | Evidence location |
| --- | --- | --- | --- |
| Install | frozen workspace install | SOURCE-PROVEN at PR #114 predecessor exact head | Studio CI / Production Verify |
| Lint | `pnpm lint` | SOURCE-PROVEN at PR #114 predecessor exact head | Studio Audit |
| Typecheck | `pnpm typecheck` | SOURCE-PROVEN at PR #114 predecessor exact head | Studio Audit / Production Verify |
| Unit/tests | `pnpm test` | SOURCE-PROVEN at PR #114 predecessor exact head | Studio CI / Production Verify |
| App build | `pnpm build` | SOURCE-PROVEN at PR #114 predecessor exact head | Studio CI / Visual Proof |
| Functions build | `pnpm --dir functions build` | SOURCE-PROVEN at PR #114 predecessor exact head | Studio Audit / Production Verify |
| Done-done guard | `pnpm done-done:guard` | SOURCE-PROVEN at PR #114 predecessor exact head | Studio Audit |
| Evidence contract guard | `pnpm release:evidence:contract` | SOURCE-PROVEN at PR #114 predecessor exact head | Studio Audit |
| Health guard | exact-head health guard workflow | SOURCE-PROVEN at PR #114 predecessor exact head | run `36035410443` |
| Source-only release check | `pnpm release:check` | SOURCE-PROVEN at PR #114 predecessor exact head | Studio CI |
| Visual proof | exact-head retained pixel workflow | SOURCE-PROVEN at PR #114 predecessor exact head | artifact `10824241635` |
| Video factory source proof | exact-head video factory workflow | SOURCE-PROVEN at PR #114 predecessor exact head | artifact `10824356010` |
| Provider-backed execution | protected execution receipt | UNPROVEN / HARD-OFF | No paid provider execution receipt |
| Paid provider spend | explicit spend authority + provider receipt | NOT AUTHORIZED | Source state cannot authorize spend |
| Firebase deployment | protected Firebase deploy output tied to merged exact SHA | UNPROVEN | No current protected deployment receipt |
| Live-domain equivalence | runtime/deployment SHA readback + route smoke | UNPROVEN | No current exact-head live readback |
| Independent review | genuine exact-head APPROVED review | UNPROVEN | No APPROVED review on PR #114 current line |
| Public release | approved release action + deployment/live/review proof | NOT AUTHORIZED | Source proof alone is insufficient |

## Current terminal execution matrix

| Authority | Purpose | Exact head | Current classification |
| --- | --- | --- | --- |
| Studio PR #114 | terminal Studio release candidate | `de24d0fe38735d761d1a36e9971f03ea8d6cc108` | **SOURCE-PROVEN predecessor head; this ledger correction creates a successor SHA that must re-earn proof** |
| Jobs PR #105 | terminal URAI Jobs authority | `82826ab4170d67d4c9df25f29696223cc7097f05` | **13/13 exact-head workflows SUCCESS / unmerged / independent review absent** |
| Spatial PR #1301 | Studio-Spatial 0.2.0 consumer | `d12c3280104d50447c1d2fdb7781c9eaafa8cd92` | core exact-head workflows SUCCESS; Reference Estate Exact-Head Capture re-run queued; independent review absent |

Superseded Studio predecessor PRs are historical provenance only. Their approval or deployment evidence must not transfer to PR #114 or any successor SHA.

### Activation classification

The following remain **HARD-OFF / NOT AUTHORIZED**, regardless of source completeness:

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

The following remain **UNPROVEN EXTERNAL/HUMAN GATES**:

- independent exact-head human approval on the unchanged terminal Studio head;
- protected merge into `main`;
- exact-main verification;
- protected Firebase deployment;
- live-domain exact-SHA equivalence;
- repository branch-protection administration readback/enforcement.

No row above is a deployment, provider, live-runtime, merge, human-approval, or public-release claim.

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

PR #114 is the single terminal Studio release authority. The previously proven exact head `de24d0fe38735d761d1a36e9971f03ea8d6cc108` was six-of-six machine-green with retained source, visual, and video-factory artifacts. This ledger correction intentionally creates a successor SHA, so that predecessor machine proof becomes historical immediately after this commit and the successor must re-earn exact-head proof.

Provider execution, paid spend, protected deployment, live-domain equivalence, independent review, merge, public release, live XR, and production migration remain separately unproven or unauthorized.
