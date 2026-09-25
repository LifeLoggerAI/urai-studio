# URAI Digital Human, Voice and Performance Launch Authority

Status: source-contract authority; provider execution and public release remain hard-off until evidence exists.

## Launch scope

URAI launch architecture may support digital-human experiences, narrator/avatar performance, TTS, authorized synthetic voice, authorized voice cloning, lip sync, gaze, eye contact, facial performance, body motion, hair/cloth behavior, captions, transcripts, and accessible alternatives.

This authority does **not** claim that photoreal digital humans, production voice cloning, streaming lip sync, or final likeness-bearing performance are currently provider-live or visually certified.

## Mandatory identity and rights boundary

Every likeness-bearing performance requires:
- subject identity binding;
- subject consent evidence;
- likeness/rights authority;
- revocation authority;
- guardian/dependent authority when applicable.

Voice cloning requires separate explicit voice consent, voice-rights authority, source provenance, and disclosure. Existing recordings alone are not authorization.

## Voice modes

The governed source contract supports:
- original recording;
- authorized synthetic voice;
- authorized voice clone;
- provider-neutral TTS;
- no voice.

Captions and transcripts remain mandatory whenever speech is present. Voice-only understanding must not be required where an accessible text/visual alternative is appropriate.

## Performance contract

A launch performance plan can declare:
- face rig: none / blendshape / FACS-compatible;
- viseme source;
- lip-sync mode;
- gaze mode;
- eye-contact state;
- blink model;
- body-motion provenance;
- hair and cloth mode;
- reduced-motion equivalent;
- non-visual equivalent;
- measurable latency budgets.

Lip sync cannot be declared when no viseme set exists. Eye contact cannot be declared with no gaze model.

## Latency receipts

Each final interactive performance should retain measured receipts for:
- speech-start latency;
- interruption/barge-in response;
- absolute lip-sync offset;
- gaze response.

A configured budget is not evidence that the runtime meets it.

## Approval gates

Every plan starts with:
- final likeness approval = false;
- final voice approval = false;
- final performance certification = false;
- provider execution authorization = false;
- public release authorization = false.

Those states may only change through the appropriate governed release/provider/human-review authority. Source code must not silently promote them.

## Provider boundary

The existing Studio provider adapter already recognizes `voice` as a provider media type and retains hard-off provider execution. This contract adds the identity/performance authority needed before any provider-specific voice/avatar implementation can be safely activated.

Provider selection must record:
- provider/model/voice identifier;
- data retention policy;
- training-use policy;
- likeness policy;
- region;
- latency;
- cost;
- cancellation/retry behavior;
- artifact provenance;
- replacement/fallback path.

## AAA+++ visual/performance acceptance

Source completeness is not visual acceptance. A final digital human requires independent visual and performance evidence covering, where applicable:
- identity/likeness;
- skin, eyes, teeth, tongue and mouth interior;
- hair/facial hair;
- clothing and cloth behavior;
- face rig and micro-expression quality;
- lip/phoneme/viseme synchronization;
- blink/saccade/gaze behavior;
- eye contact;
- breathing and idle behavior;
- gesture/body timing;
- lighting/contact shadows;
- camera distance/FOV;
- uncanny-valley defects;
- desktop/mobile/XR variants;
- performance budgets.

## Current truth boundary

Current Studio authority contains provider-neutral voice-generation plumbing, Life Movie consent/rights/provenance requirements, and motion-direction classes for character face, lip sync, hair/cloth, and haptics.

Current motion authority explicitly does not generally certify photoreal facial performance, production lip sync, hair simulation, cloth simulation, or final likeness-bearing performance.

Therefore the launch state is:
**ARCHITECTURE / GOVERNANCE CONTRACT IMPLEMENTED; FINAL PROVIDER + RUNTIME + VISUAL PERFORMANCE CERTIFICATION OPEN.**
