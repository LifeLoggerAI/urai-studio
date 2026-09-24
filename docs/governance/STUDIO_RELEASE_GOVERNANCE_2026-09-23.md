# URAI Studio Release Governance Requirements — 2026-09-23

Status: SOURCE CONTROL REQUIREMENT. This document does not itself change GitHub administration settings.

## Current observed repository governance

Repository: `LifeLoggerAI/urai-studio`.

Current visible default branch: `main`.

Current visible `main` SHA: `cae4ddc6fd2c3ec64664ed628f74434a93b4497c`.

GitHub branch metadata currently reports:

- `protected: false`
- protection enforcement disabled
- no required status-check contexts in the visible branch metadata
- repository rulesets endpoint returns no rulesets

The connected GitHub App does not provide branch-administration mutation authority, so this source pass cannot truthfully claim protection was enabled.

## Required merge protection

Before a launch candidate is merged to `main`, repository administration should enforce the current exact-head workflow suite rather than a stale predecessor suite.

For the current Studio workflow topology, the required checks are:

1. `URAI Production Verify`
2. `URAI Studio Video Factory Verification`
3. `Studio CI`
4. `Studio Audit`
5. `Studio Visual Proof`
6. `Studio Health Guard`

Protection must reject stale-head success. A successor commit must re-run and pass the checks at its own SHA.

## Review requirement

A material release candidate requires genuine independent review anchored to the unchanged exact head.

Current evidence for PR #97:

- head: `9480510c05bcfa788e57b9dce170020e95590a61`
- six exact-head workflows successful
- zero recorded pull-request reviews

Current reviewer eligibility observation for `LimberNutz`:

- repository permission lookup reports `read`
- a review request on PR #97 returned GitHub 422: `Reviews may only be requested from collaborators`

Until GitHub accepts the reviewer request and a genuine `APPROVED` review is recorded on the unchanged exact head, independent review remains unproven.

Do not substitute a bot/self review.

## Current bounded Studio authority graph — 2026-09-24 UTC

The active source graph is intentionally split by responsibility.

### Proven exact-head source lanes

- #97 — V1 creative-workstation candidate at `9480510c05bcfa788e57b9dce170020e95590a61`; six workflows green; independent review still absent.
- #98 — future-capability authority registry at `e1821b64f44911a94d618d1419f96e504488646c`; six workflows green.
- #99 — canonical Studio V3 data model at `6227470e6c4a62583e1f4b8e23c0c22e015d4df6`; six workflows green.
- #103 — Studio producer half of Studio-Spatial 0.2.0 at `8b642fc67229dde62612c5f4d0ad25672b4957ea`; six workflows green.
- #105 — canonical-root hygiene at `d23a8d1d409e52da33f7831286dd79b40ff1595a`; six workflows green.

### Current proof-draining lanes

- #100 — observed readiness/status truth, current head `dba0ff65d66595d0c7010843f2253794e37ff64c`.
- #107 — clean hard-off future rails rebuilt on green #99, current head `f39e2658f20425b128543f5f262bd79f93702f96`.
- #108 — clean provenance-bound Life Movies child of #107, current head advances independently and must be re-fetched before acceptance.
- Spatial #1301 — matching Studio-Spatial 0.2.0 consumer rebuilt on current Spatial #1296 authority; exact-head proof pending.
- Jobs #103 — provider-free Life Movies `studio.render.video` worker/bridge authority; frozen-lockfile manifest mismatch repaired and successor proof pending.
- #104 — this evidence/governance lane; every documentation change advances its own exact head and must re-earn proof.

### Superseded / closed lanes

- #96 — superseded by #97.
- #101 — stale/conflicted future-rails ancestry; superseded by clean #107.
- #106 — stale/conflicted Life Movies ancestry; superseded by clean #108.
- Spatial #1300 — predecessor 0.2.0 consumer built on an older moving #1296 base; superseded by #1301.

Superseded lanes must not be merged and their review/CI evidence must not transfer.

### Dependency rules

- #107 depends on proven #99.
- #108 depends on #107 and does not own the shared provider/export/provenance rails independently.
- #103 is not integrated until the paired Spatial #1301 consumer is proven at its own exact head.
- Life Movies source planning in #108 is not executable until its own hard-off feature gate is separately authorized; current source must perform no project write or Jobs dispatch while hard-off.
- Jobs remains the durable execution owner for `studio.render.video`; Studio remains orchestration/review/mastering authority.

No child is authorized merely because its parent is green.

## Release-state separation

Source proof, provider proof, deployment proof, live proof, independent review and public release remain separate gates.

A protected merge does not itself authorize:

- provider spend
- provider execution
- Firebase deployment
- public publishing
- external delivery
- XR activation
- public release
