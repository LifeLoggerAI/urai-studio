# URAI Digital Human and Voice Authority

Status: source contract implemented; provider execution hard-off  
Owner: URAI Studio  
Current implementation: `apps/studio/lib/studio/digital-human.ts`

## Launch truth

URAI Studio has a source-level contract for:

- original recorded voice;
- authorized synthetic voice;
- explicitly authorized voice cloning;
- provider-neutral TTS;
- likeness-bearing digital humans;
- subject consent and likeness rights;
- revocation authority;
- dependent/minor guardian authority;
- face rig class;
- viseme set;
- lip-sync mode;
- gaze mode and eye contact;
- blink model;
- body motion;
- hair and cloth simulation modes;
- reduced-motion and non-visual equivalents;
- latency budgets;
- provenance;
- final likeness, voice, performance, provider, and public-release gates.

This is not evidence that photoreal digital humans, production lip sync, provider-backed TTS, or voice cloning are live in production.

## Voice authority

Voice modes are intentionally distinct:

1. `original-recording`
2. `authorized-synthetic`
3. `authorized-voice-clone`
4. `provider-neutral-tts`
5. `none`

An authorized voice clone requires:

- a voice consent reference;
- a voice rights reference;
- identity-level voice rights;
- at least one source reference;
- explicit disclosure.

Synthetic voice and provider-neutral TTS require an explicit consent reference.

A real recording, uploaded clip, prior conversation, family relationship, or historical possession of audio must not be treated as automatic permission to clone or synthesize the person's voice.

## Likeness and identity authority

Every performance carries:

- subject identity;
- subject consent reference;
- likeness rights reference;
- revocation authority;
- guardian authority where the subject is a minor or dependent.

Final likeness approval starts false.

## Performance contract

The contract models:

- `blendshape` / `facs-compatible` face rigs;
- provider or custom viseme sets;
- offline-timed or streaming lip sync;
- scripted, speaker-aware, or scene-aware gaze;
- eye contact;
- procedural or recorded blinking;
- manual, recorded, or generated body motion;
- baked/runtime hair simulation;
- baked/runtime cloth simulation.

Lip sync cannot be requested without a viseme set. Eye contact cannot be enabled without a gaze model.

These fields define production requirements and validation boundaries; they do not prove the runtime exists or has been visually accepted.

## Latency budgets

Each plan must declare bounded budgets for:

- speech start;
- interruption response;
- absolute lip-sync offset;
- gaze response.

Invalid or unbounded values fail source validation.

## Accessibility

Digital-human performances require:

- captions;
- transcript;
- reduced-motion equivalent;
- non-visual equivalent.

Audio or photoreal visual performance must never become the sole carrier of required meaning.

## Hard-off launch gates

The Studio feature policy currently includes hard-off gates for:

- `synthetic-voice-execution`
- `digital-human-performance`
- `provider-execution`
- `public-publish`
- `external-delivery`

The performance plan itself also starts with:

- `finalLikenessApproved: false`
- `finalVoiceApproved: false`
- `finalPerformanceCertified: false`
- `providerExecutionAuthorized: false`
- `publicReleaseAuthorized: false`

No source-only environment switch should be interpreted as authority to bypass these gates.

## Launch activation evidence

Before claiming a production digital human or synthetic/clone voice capability is live, retain:

1. exact-head source/build/test receipts;
2. provider/model/version and data-policy receipt;
3. source provenance;
4. subject consent and rights evidence;
5. guardian authority where applicable;
6. revocation mechanism;
7. private staging output;
8. lipsync/viseme timing evidence where used;
9. gaze/eye-contact evidence where used;
10. character skin/eyes/hair/clothing/rig quality review where likeness is material;
11. captions/transcript and reduced-motion/non-visual alternatives;
12. latency measurements;
13. final likeness approval;
14. final voice approval;
15. final performance certification;
16. public-release approval;
17. deployment and rollback evidence.

## Claim boundary

Allowed now:
- "URAI Studio has a governed digital-human and voice source contract."
- "Voice cloning requires explicit consent and rights evidence."
- "Digital-human provider execution and public release remain hard-off."

Not supported yet by this contract alone:
- "Production voice cloning is live."
- "Photoreal avatars are production certified."
- "Lip sync or eye contact is production certified."
- "A person's likeness or voice may be generated from existing media without separate authority."
