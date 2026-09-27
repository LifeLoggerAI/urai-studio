# URAI Creative Timeline Authority

Status: source architecture candidate. This contract does not activate a provider, authorize spend, publish media, or certify finished creative quality.

## Purpose

URAI already has separate planning and runtime concepts for Life Movies, Film Foundry, Video Factory, Spatial motion/audio and future provider execution. This contract supplies one temporal authority those systems can converge on without forcing them into one provider or one rendering engine.

The timeline is intentionally provider-neutral. It synchronizes:

- picture and editorial cuts;
- camera;
- character/object/environment motion;
- dialogue and narration;
- music and sound;
- captions;
- haptics;
- interactive cues;
- truth/provenance labels;
- accessibility cues.

## Core rule

Creative systems may have separate generation engines, but once material enters a production timeline they must resolve against the same millisecond timebase and shared cue identities.

The contract does not claim that full adaptive scoring, photoreal human performance, lip sync, music generation or provider execution is already complete.

## Truth boundary

Recorded or otherwise evidence-bearing picture, dialogue, narration, music, sound and truth-label events require source references unless explicitly classified as generated or artistic interpretation.

Generated and artistic material must retain that provenance classification through export.

## Launch safety

The source contract starts with:

- provider execution unauthorized;
- public release unauthorized;
- a 45-minute launch timeline ceiling aligned with the current Life Movies worker contract.

Provider activation, likeness/voice synthesis, music licensing, public release and final pacing approval remain separate authorities.

## Intended integration

Life Movie project / Film Foundry control
→ Creative Timeline
→ render plan
→ Jobs / FFmpeg or separately authorized provider lane
→ provenance and accessibility QA
→ private review
→ separately authorized release.

Spatial/Replay may consume the same timing concepts for interactive cinema, but ordinary film output does not depend on Spatial or XR.
