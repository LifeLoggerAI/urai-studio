# URAI Studio Wave 1 Polish Status

Status: in_build
Domain: uraistudio.com
Repo: LifeLoggerAI/urai-studio
System: URAI Studio

## Purpose

This document tracks the Wave 1 polish pass for `uraistudio.com` as the commercial creative/media arm of the URAI network.

## Non-Negotiable Boundary

`uraistudio.com` is for Studio work only:

- AI campaigns
- cinematic ads
- viral shorts
- music visuals
- launch campaigns
- product visuals
- brand worlds
- social content systems
- AI character campaigns

It should not become:

- UrAi app homepage
- URAI Labs parent company site
- investor room
- privacy center
- general content network

## Existing Release Infrastructure Found

The Studio repo includes useful release scripts in `package.json`:

- `build`
- `lint`
- `typecheck`
- `test`
- `smoke`
- `studio:smoke`
- `audit`
- `release:check`
- Firebase emulator and preview scripts

Wave 1 polish should use this existing pipeline instead of replacing it.

## Wave 1 Constants Added

File:

- `src/urai-foundation/wave1-foundation.js`

Commit:

- `0695631684c15e48ee06512a45921e5165870c18`

This locks:

- studio-only boundary
- public route expectations
- hero copy
- service list
- package list
- project form shape
- analytics events
- privacy links
- Studio launch checklist

## Required Studio Routes

Confirm or implement:

- `/`
- `/start`
- `/work`
- `/services`
- `/packages`
- `/case-studies`
- `/submit-project`
- `/contact`
- `/privacy`
- `/terms`

## Content Polish Requirements

Hero line:

> AI campaigns built to stop the scroll.

Primary CTA:

> Start a Project

Secondary CTA:

> Watch the Reel

Required areas:

- showreel or visual proof area
- services grid
- packages
- proof or case-study cards
- project intake form
- usage-rights note
- URAI Privacy link
- subtle ecosystem footer

## Form Requirements

Project intake should capture:

- name
- email
- company or brand
- website or social link
- budget range
- project type
- message
- source domain
- source path
- UTM/source attribution

Preferred form type:

- `project`

Preferred destination:

- `projectRequests`

## QA / Evidence Required

Before `uraistudio.com` can be marked ready for Wave 1 review:

- run `pnpm run release:check`
- verify public routes exist
- verify project intake works
- verify no placeholder client logos or fake proof
- verify no guaranteed-performance claims
- verify privacy route is visible
- verify mobile CTA flow
- verify production URL
- verify staging URL if used
- verify DNS and SSL

## Current Blockers

- Studio route/content inspection still pending
- project intake form wiring not yet verified in this Wave 1 pass
- live deployment evidence pending
- DNS/SSL evidence pending
- production/staging verification pending

## Next Step

Inspect current Studio routes and align stale public copy with the Wave 1 constants while preserving the Studio/client conversion boundary.
