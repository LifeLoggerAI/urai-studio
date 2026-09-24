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

Current source-control checkpoint: Studio PR #98 exact head `e1821b64f44911a94d618d1419f96e504488646c`.

All six pull-request workflows completed successfully at that exact head on 2026-09-24 UTC:

- Studio Visual Proof — run `35947630810`
- Studio Audit — run `35947630853`
- Studio CI — run `35947630841`
- Studio Health Guard — run `35947630844`
- URAI Production Verify — run `35947630822`
- URAI Studio Video Factory Verification — run `35947630883`

Retained exact-head artifacts:

- `urai-studio-visual-e1821b64f44911a94d618d1419f96e504488646c` — artifact `10789095312` — `sha256:b0ac3daaa4cd8005e31145e2e00be945e9154a8fd174113eaf5c3bcf5019dc0c`
- `studio-source-evidence-e1821b64f44911a94d618d1419f96e504488646c` — artifact `10787924356` — `sha256:452205f6ef8819754b5a4e72ef82652815a489eea596df054aca7a570a17e0dd`
- `urai-studio-video-factory-evidence` — artifact `10788159957` — `sha256:bab922cffe85e964b54156a16ea25c2d00a51e84869056fd2ab710201fafc8f5`

These receipts prove source/workflow state only. They do not transfer to successor heads and do not prove provider execution, protected deployment, live-domain equivalence, independent review, or public release.

| Gate | Required command or proof | Current classification | Evidence location |
| --- | --- | --- | --- |
| Install | frozen workspace install | SOURCE-PROVEN at #98 exact head | Studio CI / Production Verify |
| Lint | `pnpm lint` | SOURCE-PROVEN at #98 exact head | Studio Audit / exact-head source receipt |
| Typecheck | `pnpm typecheck` | SOURCE-PROVEN at #98 exact head | Studio Audit / Production Verify |
| Unit/tests | `pnpm test` | SOURCE-PROVEN at #98 exact head | Studio CI / Production Verify |
| App build | `pnpm build` | SOURCE-PROVEN at #98 exact head | Studio CI / Visual Proof |
| Functions build | `pnpm --dir functions build` | SOURCE-PROVEN at #98 exact head | Studio Audit / Production Verify |
| Done-done guard | `pnpm done-done:guard` | SOURCE-PROVEN at #98 exact head | Studio Audit |
| Evidence contract guard | `pnpm release:evidence:contract` | SOURCE-PROVEN at #98 exact head | Studio Audit |
| Health guard | exact-head health guard workflow | SOURCE-PROVEN at #98 exact head | run `35947630844` |
| Source-only release check | `pnpm release:check` | SOURCE-PROVEN at #98 exact head | Studio CI |
| Visual proof | exact-head retained pixel workflow | SOURCE-PROVEN at #98 exact head | artifact `10789095312` |
| Video factory source proof | exact-head video factory workflow | SOURCE-PROVEN at #98 exact head | artifact `10788159957` |
| Provider-backed execution | protected execution receipt | UNPROVEN / HARD-OFF | No provider execution receipt |
| Paid provider spend | explicit spend authority + provider receipt | NOT AUTHORIZED | Source state cannot authorize spend |
| Firebase deployment | protected Firebase deploy output tied to exact SHA | UNPROVEN | No current protected deployment receipt |
| Live-domain equivalence | provider/runtime SHA readback + route smoke | UNPROVEN | No current exact-head live readback |
| Independent review | genuine exact-head APPROVED review | UNPROVEN | No review on #98 |
| Public release | approved release action + deployment/live/review proof | NOT AUTHORIZED | Source proof alone is insufficient |

## Current successor execution matrix — 2026-09-24 UTC

The machine-green #98 checkpoint remains historical source proof only. Current work is split into bounded successors; exact heads are re-fetched before acceptance and no predecessor proof transfers.

| PR | Purpose | Current known exact head | Current classification |
| --- | --- | --- | --- |
| #99 | canonical Studio data model V3 | `6227470e6c4a62583e1f4b8e23c0c22e015d4df6` | **SOURCE-PROVEN — 6/6 exact-head workflows success** |
| #100 | observed readiness / truthful status | `dba0ff65d66595d0c7010843f2253794e37ff64c` | successor proof draining after stale-copy guard repair |
| #103 | Studio producer half of Studio-Spatial 0.2.0 | `8b642fc67229dde62612c5f4d0ad25672b4957ea` | **SOURCE-PROVEN — 6/6 exact-head workflows success** |
| #104 | evidence/governance reconciliation | current branch head changes with this ledger | documentation-only successor must re-earn exact-head proof |
| #105 | canonical-root hygiene | `d23a8d1d409e52da33f7831286dd79b40ff1595a` | **SOURCE-PROVEN — 6/6 exact-head workflows success** |
| #107 | clean hard-off provider/job/export/review/accessibility/control rails | `f39e2658f20425b128543f5f262bd79f93702f96` | proof draining; rebuilt atomically on green #99 |
| #108 | provenance-bound Life Movies launch foundation | re-fetch live head before use | proof draining; hard-off before write/Jobs dispatch |
| Spatial #1301 | Studio-Spatial 0.2.0 consumer | re-fetch live head before use | proof draining on current Spatial #1296 base |
| Jobs #103 | provider-free `studio.render.video` Life Movies worker | re-fetch live head before use | proof draining after frozen-lockfile repair |

Superseded and closed: Studio #96, #101, #106 and Spatial #1300.

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
- Life Movies render dispatch;
- production V3 migration.

The following remain **UNPROVEN EXTERNAL/HUMAN GATES**:

- protected deployment;
- live-domain exact-SHA equivalence;
- independent review on the applicable unchanged release head;
- repository main branch protection/ruleset enforcement.

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

Studio PR #98 is exact-head machine-green with retained source, visual, and video-factory evidence at `e1821b64f44911a94d618d1419f96e504488646c`.

That source proof is complete for the #98 checkpoint only.

Provider execution, paid spend, protected deployment, live-domain equivalence, independent review, production freeze, and public release remain separately unproven or unauthorized. Successor branches must re-earn their own exact-head source evidence; no #98 acceptance transfers.
