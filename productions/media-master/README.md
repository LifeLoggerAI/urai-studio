# URAI V1–V5 Media Master

Parent authority: `LifeLoggerAI/urai-studio#70`.

This directory is the public, privacy-safe orchestration contract for the URAI V1–V5 cinema/media estate. It does not replace product, asset-lock, private-film, rights, legal, provider, or release authorities.

## Canonical chain

Google Drive canon/private source → GitHub manifest/orchestration → Storytime narrative graph where applicable → Asset Factory generation → Spatial exact-SHA product capture → Studio edit/composite/audio/mastering → derivative factory → Marketing/localization/distribution → Drive/GitHub approvals and immutable receipts.

## Authority boundaries

- Canonical runtime: `LifeLoggerAI/urai-spatial`.
- Asset semantic control: Drive `URAI Final Asset Lock Master — 2026-08-11` (`10l8UZ0mi_DrrhZU-fgAfiv2i4F0Vuqd3bvEKriudp1Y`).
- Media-calendar source: Drive `URAI 90-Day Global Media Calendar — 45+45 — 2026-07-18` (`1MbjBHLVzVM2ppnfiCArBXo-e3d-D-GZ0xd-D5HWAJJk`).
- Generation: `LifeLoggerAI/asset-factory`; provider-backed execution remains separately gated.
- Mastering/packaging: `LifeLoggerAI/urai-studio`.
- Narrative authority where applicable: `LifeLoggerAI/urai-storytime`.
- Public campaign/claims routing: `LifeLoggerAI/urai-marketing`.

Never hard-code a release-candidate SHA as permanent runtime truth. Resolve the current exact head and its current evidence immediately before capture, approval, or release.

## 213-deliverable rule

The 213-entry Asset Lock is a semantic inventory, not a command to create 213 flat files. A row may be satisfied by an accepted GLB, shader/procedural effect, runtime composite, UI code, camera behavior, audio artifact, export template, or other canonical implementation plus evidence.

Do not generate a new asset merely because a legacy row says `TO PRODUCE`. First reconcile the current runtime and approved-source estate. Accepted artifacts are immutable unless current evidence proves they are missing, rejected, corrupt, visually unacceptable, rights-blocked, or superseded.

## State classes

- `A` approved / immutable / reuse
- `B` implemented as runtime / no new media asset required
- `C` present but requires visual QA or founder lock
- `D` present but requires rights / consent / provenance
- `E` present but requires integration
- `F` needs final production
- `G` needs provider generation
- `H` needs product capture
- `I` needs audio / voice / music
- `J` needs motion / camera / VFX
- `K` needs UI / glyph / brand production
- `L` needs derivative export
- `M` needs localization / accessibility
- `N` blocked on human approval
- `O` blocked on legal / rights / claim review
- `P` superseded / remove from active plan

## Product capture

Product footage is reusable only when the capture receipt binds the artifact to an exact repository SHA, route/world, camera path, viewport/device profile, capture date, QA state, hash, and required human visual approval. Genuine footage is not automatically film-quality footage.

Final capture profiles must support a high-quality 16:9 master and governed 9:16, 1:1, 1080p, still, clean-plate, sound-on, sound-off, and textless derivatives where applicable.

## Paid/provider generation

Paid generation is fail-closed in the media master. It requires a separate bounded authorization containing provider/model, allowed asset IDs or shot IDs, maximum calls, maximum retries, maximum spend, privacy/retention rules, and retained receipts. This directory never grants provider credentials or spend authority by itself.

## Human gates

Automation may prepare, generate, validate, transcode, caption, localize, hash, file, and receipt work where authorized. It may not approve Adam/family/advisor likeness, autobiographical or disputed factual truth, legal/counsel content, privacy/rights, music licensing, trademark/archive use, product visual quality, public claims, final film pacing, or final public release.

## Media jobs

`90-day-media-jobs.json` is a source-grounded launch queue. Every job remains release-disabled until its actual claim, runtime, capture, rights, accessibility/localization, and human gates are satisfied. The calendar is a production source; it is not proof that a feature is live.

## Production registry

Existing productions remain under their controlling authorities. This parent graph references them; it does not restart them:

- `Before the Rest of the World`
- `FINITE TIME`
- `Before You Advise Me` / private-memory-film contract
- Kickstarter Hero Film
- Storytime / Legacy film families

## Release rule

File presence is not acceptance. Source CI green is not provider readiness. Provider output is not final product capture. Product capture is not a finished film. A finished film is not public-release authorization. Each transition must retain its own evidence and approval receipt.