# URAI Genesis Studio Asset Contract

Last updated: 2026-06-01

## Purpose

This repository owns creator/studio tooling for URAI Genesis assets, previews, and launch-ready media. Studio output must support the polished app experience without leaking placeholder, debug, or demo labels into production.

## Main app asset expectations

The current Genesis home implementation expects sound hooks at:

```txt
/sounds/urai/home-ambient.mp3
/sounds/urai/orb-open.mp3
/sounds/urai/orb-close.mp3
/sounds/urai/memory-star-open.mp3
/sounds/urai/passport-open.mp3
/sounds/urai/permissions-open.mp3
/sounds/urai/life-map-transition.mp3
```

Missing sound files should not crash the app, but production Genesis should include final or intentionally silent approved assets.

## Genesis asset families

```txt
[ ] Orb idle / pulse / open cues
[ ] Sky / aurora / mood-weather atmospheres
[ ] Ground-layer ambient texture
[ ] Memory-star open cue
[ ] Passport/control panel cue
[ ] Life-map transition cue
[ ] Launch screenshots
[ ] Short demo clips
[ ] Investor/demo preview renders
```

## Production rules

- No filenames, labels, or visual overlays containing `demo`, `debug`, `test`, or internal notes in user-facing assets.
- Preserve URAI visual language: immersive, minimal, polished, non-clinical.
- Keep assets optimized for app delivery.
- Document source, license, and export settings for each asset.

## Readiness checklist

```txt
[ ] Required sound files exist or intentional silent placeholders are documented.
[ ] App screenshots match the current Genesis home.
[ ] Mobile and desktop preview assets exist.
[ ] No placeholder/debug overlays are visible.
[ ] Export paths match app expectations.
[ ] Asset licensing/source notes are recorded.
```
