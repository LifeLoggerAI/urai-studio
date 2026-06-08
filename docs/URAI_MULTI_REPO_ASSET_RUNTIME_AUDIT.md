# URAI Multi-Repo Asset Runtime Audit

Purpose: prevent duplicate work by separating what belongs in the active app repo from what already exists in the surrounding URAI repo lattice.

## Active repo discovered from local terminal

The local checkout Adam is actively using is:

```text
~/UrAi
origin https://github.com/LifeLoggerAI/UrAi.git
branch main
```

This is the app repo to run and verify first. Do not assume `LifeLoggerAI/UrAiProd` is the local app checkout unless the terminal remote says so.

## Repo responsibility map

| Repo | Role | Current action |
| --- | --- | --- |
| `LifeLoggerAI/UrAi` | Active app runtime, Firebase app, Next app, public assets, Genesis checks, launch scripts. | Finish runtime wiring and use existing `check:genesis:*` scripts before adding assets. |
| `LifeLoggerAI/asset-factory` | Asset generation pipeline, image generator, previews, Firebase seed/export, deploy/studio checks. | Reuse for graphics/assets. Do not manually regenerate app assets until `image:manifest`, `image:check`, and exports are reviewed. |
| `LifeLoggerAI/urai-studio` | Studio/admin UI for jobs, previews, smoke tests, release checks. | Use for asset/job visibility and release checks, not app runtime. |
| `LifeLoggerAI/urai-content` | Content packages, sprite/content validation, seed/system seed checks, content web checks. | Reuse narrative/content/sprite validation. Do not hand-copy content into app without content index/check. |
| `LifeLoggerAI/urai-spatial` | Spatial/XR monorepo, URAI Tier1 runtime, camera/nav/XR checks, spatial invariants. | Reuse for 3D/spatial behavior instead of rebuilding spatial engine in app. |
| `LifeLoggerAI/UrAiProd` | Production mirror/alternate production app work. | Treat as secondary unless intentionally syncing into `UrAi`. |

## Evidence from repo scripts

### `LifeLoggerAI/UrAi`

The app repo already has Genesis and asset checks:

```text
npm run check:genesis
npm run check:genesis:assets
npm run check:genesis:audio
npm run verify:assets
npm run check:home
npm run check:types
npm run build
```

The app repo uses npm/package-lock style scripts, not the nested `apps/web` pnpm layout that was mistakenly assumed earlier.

### `LifeLoggerAI/asset-factory`

The asset factory already has a complete image pipeline:

```text
npm run image:manifest
npm run image:generate
npm run image:validate
npm run image:preview
npm run image:seed
npm run image:export
npm run image:check
```

It also has launch and production checks:

```text
npm run verify:local
npm run verify:production
npm run verify:launch
npm run deploy:production
npm run smoke:production-finalization
```

### `LifeLoggerAI/urai-studio`

The studio repo already has filtered app checks and smoke/release checks:

```text
pnpm audit
pnpm release:check
pnpm studio:smoke
pnpm studio:preview
pnpm studio:doctor
```

### `LifeLoggerAI/urai-content`

The content repo already has content, sprite, seed, and web checks:

```text
npm run validate:content
npm run validate:sprites
npm run content:index
npm run seed:check
npm run seed:system:check
npm run smoke
npm run check
npm run check:all
```

### `LifeLoggerAI/urai-spatial`

The spatial repo already has XR, navmesh, camera, runtime boundary, spatial invariant, and tier-lock checks:

```text
pnpm check:spatial
pnpm xr:contract
pnpm xr:navmesh:bake
pnpm xr:verify
pnpm test:e2e:camera-transitions
pnpm test:e2e:navigation-stack
pnpm test:visual:spatial
pnpm audit:tier-one
pnpm verify:release:full
```

## Immediate rule

Before adding any new image, 3D model, animation, audio, glyph, weather layer, memory star, sky/ground layer, avatar, replay scene, or spatial effect:

1. Check `LifeLoggerAI/UrAi/public` and `assets-list.txt` in the local app checkout.
2. Check `LifeLoggerAI/asset-factory` pipeline outputs/manifests.
3. Check `LifeLoggerAI/urai-studio` job/preview state.
4. Check `LifeLoggerAI/urai-content` for content/sprite ownership.
5. Check `LifeLoggerAI/urai-spatial` for 3D/XR/spatial ownership.
6. Only generate new assets if the asset cannot be found in those places or the existing asset fails runtime checks.

## Correct local command sequence for Adam's current terminal

From `~/UrAi`:

```bash
cd ~/UrAi
npm run check:genesis
npm run check:genesis:assets
npm run check:genesis:audio
npm run verify:assets
npm run check:home
npm run typecheck
npm run build
```

If disk space is low, do not reinstall first. Run the checks that do not need new dependencies, then clean install artifacts only if required.

## Completion state

This audit does not claim all assets are finished. It establishes that URAI already has separate repos and scripts for:

- app runtime checks,
- Genesis asset/audio checks,
- image generation,
- image validation,
- previews,
- Firebase seed/export,
- studio job/release checks,
- content/sprite validation,
- spatial/XR/camera/navmesh checks.

The next finishing task is not broad asset regeneration. The next task is to run these repo-specific checks and reconcile failures into a single launch blocker list.
