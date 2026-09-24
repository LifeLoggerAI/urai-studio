# URAI Life Movies — Launch Authority

Status: source implementation candidate. Exact-head CI, independent review, deployment, runtime proof and final media-quality acceptance remain separate gates.

## Ownership

URAI Studio owns Life Movies orchestration, film planning, render planning, export packaging, review and provenance. Storytime may provide narrative source material. Asset Factory may provide generated media only through governed, separately authorized provider execution. Replay may provide memory source references. Spatial is optional and is not a prerequisite for creation, rendering, playback or export of an ordinary Life Movie.

The old `UrAiProd` Life Movie implementation is historical evidence only. It is not production authority.

## Launch contract

A Life Movie may use approved photos, video, audio, transcripts, memories, Storytime material and Replay material. Every source must carry:

- source identity;
- consent authority;
- ownership/rights authority;
- provenance references;
- provenance state.

The canonical provenance states are original source, user-provided fact, verified metadata, user-recorded memory, inferred, reconstructed, generated, artistic interpretation and unknown.

Projects are private by default. Public release and provider generation both begin unauthorized.

The deterministic launch output set is:

- MP4 video;
- SRT captions;
- JSON render/provenance manifest.

The base render engine contract is an FFmpeg worker. Paid provider generation is not required to assemble a film from source media. Reconstruction/generation is an enhancement lane and must stay separately gated until provider, privacy, consent, rights, cost and quality evidence exists.

## Product path

1. Select approved sources.
2. Build or import chapters.
3. Review source provenance, consent and rights.
4. Build deterministic timeline and captions.
5. Queue the canonical Studio video job.
6. Render/preview through the approved worker.
7. Review the finished film.
8. Export the private MP4/SRT/JSON package.
9. Public delivery requires a separate release authorization.

## Safety and truth

Life Movies must never relabel generated or reconstructed media as original evidence. Provider execution must not occur merely because a project contains a generated/reconstructed source marker. The source contract records that generation is required while keeping provider execution unauthorized.

## Activation boundary

This source lane does not itself authorize:

- paid generation;
- public publishing;
- external delivery;
- likeness or voice synthesis;
- child/family production;
- deployment;
- production data migration.

Those require their owning gates and current exact-head proof.


## Pre-launch execution state

The source route and Jobs bridge are prebuilt but render execution is governed by the canonical Studio feature policy entry `life-movies-render`.

That feature is hard-off in this pre-launch source candidate.

While hard-off:

- POST may validate the proposed project/render plan but must not persist a project;
- no Studio render job may be created;
- no URAI Jobs bridge request may be sent;
- no provider call may occur;
- no public release may occur.

A configured bridge URL/token is not activation authority.


## URAI Jobs execution contract

Canonical execution ownership is `LifeLoggerAI/urai-jobs`.

The currently recovered launch worker authority defines:

- job type: `studio.render.video`;
- payload schema: `urai-life-movie-render-v1`;
- protected bearer-authenticated create/status/cancel bridge;
- maximum 100 sources;
- maximum 250 timeline items;
- maximum 30 minutes per timeline item;
- maximum 45-minute launch render timeline;
- maximum bridge request body of 32,768 bytes;
- tenant-contained GCS paths only;
- supported image/video/audio MIME allowlist;
- provider generation false;
- public release false;
- Spatial required false.

Studio mirrors these limits before any future dispatch. Jobs remains the durable execution owner; Studio remains orchestration/review/mastering authority.

The pre-launch Studio feature gate still prevents dispatch even when the bridge is configured.
