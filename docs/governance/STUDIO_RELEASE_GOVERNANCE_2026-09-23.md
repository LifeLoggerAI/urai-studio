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

## Merge order for the current bounded Studio stack

The current child work is deliberately split so unrelated future foundations do not become one unsafe merge.

Dependency intent:

- #97 — current V1 creative-workstation candidate
- #98 — future-capability authority registry, child of #97
- #99 — Studio V3 data model, child of #98
- #101 — hard-off future rails, child of #99
- #100 — observed readiness/status truth, independent child of #98
- #103 — Studio half of Studio-Spatial 0.2.0, independent child of #98
- Spatial #1300 — matching Spatial consumer half, child of live Spatial #1296
- #104 — evidence ledger reconciliation, independent child of #98
- #105 — canonical-root hygiene, independent child of #98

No child is authorized merely because its parent is green.

#103 must not be treated as integrated until the matching Spatial #1300 contract is accepted at its own exact head.

#101 does not carry an alternate Studio-Spatial wire decision; paired #103/#1300 own that change.

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
