# URAI Creative System — Terminal Execution Receipt

## Scope

This receipt covers the current convergence work for URAI Music, Motion, Cinema / Life Movies, Director authority, creative timing, Captured Reality / Gaussian reconstruction, Replay entry, and the deterministic Studio-to-Jobs render path.

This document records source and verification state only. It does not convert missing review, runtime deployment, provider, rights, visual-acceptance, or human approval into completion.

## Current exact authorities

- URAI Studio PR #117 — `feature/creative-timeline-authority-20260925` — exact head `e5dd9a2f679cc419faee15e033946b3b87e66893` at the latest receipt read.
- URAI Spatial PR #1296 — `converge/final-canon-spatial-20260922` — exact head `f9603630ca00dce170c0a074a45061e38232b3b3` at the latest receipt read.
- URAI Spatial PR #1314 — `feature/captured-reality-gaussian-v1-r4-20260925` — exact head `d28e6deed7852bac8579c3199e87bed52ecc1441`.
- URAI Spatial PR #1316 — `feature/captured-reality-replay-entry-20260925` — exact head `26b6626795710a29fde577ed61135461a7ddad41`.
- URAI Jobs PR #105 — `converge/jobs-terminal-system-20260924` — exact head `4135734ca0934973844ddc6cc5cf51ed7aa3a8ee`.

Exact-head evidence does not transfer to a successor SHA.

## Completed source repairs and hardening

### Studio creative convergence

PR #117 now carries a governed creative-system layer instead of disconnected feature labels.

Implemented:
- canonical provider-neutral millisecond creative timeline;
- picture, camera, motion, dialogue, narration, music, sound, captions, haptics, interaction, truth-label and accessibility lanes;
- functional Director / production-authority model;
- explicit separation between Studio creative authority and Asset Factory / provider execution authority;
- human-approval gates for final pacing, disputed/autobiographical truth, likeness or voice synthesis, music licensing, public claims and final release;
- governed Music Direction contract;
- governed Motion Direction contract;
- Life Movies authority reconciliation against the current Jobs renderer evidence.

Music Direction now preserves:
- score intent and motif continuity;
- dialogue priority;
- stems;
- cue sheets;
- loop and tail plans;
- dialogue / narration ducking planning;
- rights authority;
- provenance classification;
- sensory-safe and audio-description mix planning;
- provider execution hard-off by default.

Motion Direction now truthfully separates currently evidenced URAI capability from unfinished photoreal-human production capability.

Currently evidence-backed motion classes:
- camera;
- environmental motion;
- object motion;
- Orb state motion;
- route / world transitions;
- haptic cues;
- reduced-motion alternatives.

Not generally production-certified:
- photoreal facial performance;
- production lip sync;
- final hair simulation;
- final cloth simulation;
- likeness-bearing final human performance.

### Spatial convergence repairs

On the Spatial convergence lane:
- retired the obsolete Home V91 / V76 regression contract that targeted deleted visual authority;
- removed its compact-runner entry;
- retired the obsolete Orb convergence contract that required a deleted Sacred Home and a superseded third-person-avatar model;
- retained current bodyless first-person and current Orb authority instead of resurrecting rejected predecessor art.

These repairs intentionally remove stale verification assumptions rather than weaken current product contracts.

### Captured Reality Gaussian base

PR #1314 was repaired to:
- provide required `sourceEvidence` in the Gaussian V1 contract fixture;
- preserve source-backed reconstruction validation;
- explicitly verify both location and memory consent modes in the privacy-runtime contract.

The previous exact-head CI red was a test-contract mismatch against the current explicit `locationMode` / `memoryMode` implementation. The successor head is `d28e6deed7852bac8579c3199e87bed52ecc1441`; fresh exact-head CI must still be earned.

### Captured Reality private browser / Replay entry

PR #1316 was repaired to remove an incompatibility between the private dynamic route and URAI's canonical static export.

The private runtime now uses:
- static shell route `/spatial/captured-reality`;
- opaque `assetId` query state only;
- authenticated Firebase callable functions for actual metadata and runtime delivery;
- short-lived signed private storage URLs;
- owner checks;
- memory and location consent;
- release-state checks;
- browser / mobile certification gates;
- source-backed truth class;
- privacy revocation monitoring;
- deterministic exit;
- redacted provenance presentation.

The superseded `[assetId]` dynamic page was deleted.

Replay now enters through:
`/spatial/captured-reality?assetId=<opaque-id>`

The shell contains no private source data at static-build time. Authorization remains server-owned.

### Life Movies / Cinema execution chain

Direct cross-repository inspection verifies that current Studio Life Movies payloads align with Jobs #105 on:
- job family `studio.render.video`;
- schema `urai-life-movie-render-v1`;
- maximum 100 sources;
- maximum 250 timeline items;
- maximum 45-minute launch render window;
- supported media MIME families;
- tenant-bounded source paths;
- tenant/project output prefix;
- `spatialRequired: false`;
- `providerGenerationAuthorized: false`;
- `publicReleaseAuthorized: false`.

Jobs #105 contains an implemented `life-movie-ffmpeg-v1` Studio worker with:
- FFmpeg and FFprobe;
- tenant and source-bucket validation;
- source MIME allowlisting;
- private GCS inputs / outputs;
- MP4 output;
- SRT output;
- JSON render manifest;
- SHA-256 output receipts;
- protected bearer worker auth;
- readiness and health endpoints;
- exact-source and rollback-bound deploy machinery;
- pinned Secret Manager version checks;
- immutable container digest checks;
- deployment-receipt validation.

PR #105's current machine matrix is green.

This proves source readiness and deployment machinery. It does not prove the current Studio worker candidate is the live exact-head production revision.

## Private Drive authority reconciled

The source work was cross-checked against private Drive production authority including:
- FINITE TIME Film Foundry — Canonical Production Authority;
- FINITE_TIME_Score_Direction.md;
- URAI V1–V5 Cinema Factory control material.

The recovered authority supports this ownership model:
- Storytime owns story canon, chronology, narration, emotional arcs and source truth;
- Asset Factory owns governed generation, provider adapters, provenance, budgets and retained evidence;
- Studio owns orchestration, directing, continuity, editorial compilation, review and finishing control;
- Spatial owns approved immersive presentation and Replay/world integration.

The score authority also requires stems, cue sheets, sound-source rights, transition tails, narration intelligibility review, accessible / sensory-safe delivery and retained evidence.

## Verification state at receipt creation

### URAI Jobs PR #105
- open;
- non-draft;
- mergeable;
- current exact head has all observed workflow runs completed successfully;
- no pull-request review recorded.

Production-verification explicitly states that the real production environment / secret precheck is skipped on pull requests because production secrets are unavailable there.

Therefore source CI is green but exact production deployment is not certified by this receipt.

### URAI Studio PR #117
- open;
- draft;
- mergeable at latest read;
- fresh exact-head Studio Audit, CI, Health Guard, Production Verify, Video Factory Verification and Visual Proof are queued.

No completion claim is made until those exact-head runs terminate successfully.

### URAI Spatial PR #1314
- open;
- draft;
- mergeable after the latest consent-contract repair;
- previous exact head had one Spatial CI failure caused by the stale generic consent assertion;
- successor exact head `d28e6deed7852bac8579c3199e87bed52ecc1441` requires fresh workflow evidence.

### URAI Spatial PR #1316
- open;
- draft;
- successor contains the static private shell repair;
- its previous Reference Estate and Main Journey failures were both caused by the dynamic page being incompatible with static export;
- successor exact-head checks are required.

### URAI Spatial PR #1296
- open;
- non-draft;
- current successor matrix is regenerating;
- governance still requires genuine independent exact-head review.

## Independent-review blocker

The intended reviewer login was resolved from live repository permissions as `LimberNutz`.

Observed collaborator-permission reads returned `read` for:
- LifeLoggerAI/urai-spatial;
- LifeLoggerAI/urai-jobs;
- LifeLoggerAI/urai-studio.

However, GitHub's review-request endpoint returned HTTP 422 on all attempted review requests with the message that `LimberNutz` is not a collaborator.

The connected GitHub toolset available in this execution has no collaborator-add or invitation mutation.

Therefore:
- no review request is falsely claimed;
- no predecessor approval is transferred;
- independent review remains an external repository-access/governance blocker.

## Remaining hard blockers

The following are not source-coding gaps that may be silently waived:

1. Fresh exact-head workflows on Studio #117, Spatial #1314, Spatial #1316 and the current Spatial #1296 successor.
2. Genuine independent exact-head approval where governance requires it.
3. Correct collaborator/reviewer access so GitHub will accept the review request.
4. Credentialed deployment and runtime proof for the exact Jobs Studio worker candidate.
5. Exact Studio-to-Jobs bridge runtime configuration and secret authority.
6. Private source-bucket deployment configuration for Life Movies.
7. Retained end-to-end Life Movie render proof from accepted private source package to MP4 + SRT + manifest.
8. Final rights / music licensing / likeness / voice authority for media that requires it.
9. Human creative acceptance of final pacing, score, performance, imagery and AAA+++ visual output.
10. Final photoreal-human performance evidence for lips, facial performance, hair, cloth and likeness-bearing animation before those capabilities are publicly represented as certified.
11. Provider/model live activation only when separately authorized; no paid provider activation is implied by this receipt.

## Launch truth boundary

The current architecture can legitimately support a launch-facing creative operating system only to the level actually proved by exact-head source, runtime and human acceptance.

The deterministic Life Movies render path is substantially implemented in source without requiring a paid generative-video provider.

Captured Reality is substantially implemented as a private, consent-bound, source-backed browser capability candidate.

Music, Motion and Director authority now have explicit governed contracts.

None of those facts authorize claiming:
- all providers are live;
- every feature is deployed;
- every photoreal human-performance mode is AAA+++;
- all rights are cleared;
- every required exact-head workflow is green;
- independent review is complete;
- public release is authorized.

## Terminal rule

Do not merge, deploy, activate paid provider execution, or publish a public capability claim merely because this receipt exists.

Advance only when the exact successor head earns its own required machine, human, governance and runtime evidence.

This receipt is a factual convergence record, not a substitute for those gates.
