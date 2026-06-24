# URAI Studio system handoff audit — 2026-06-23

## Purpose

This note records the final audit finding for Studio's system-of-systems handoff surface.

## Verified source state

`apps/studio/app/studio/page.tsx` already links the dashboard to `/studio/video-factory`, so the older Video Factory dashboard-link TODO is closed in source.

`apps/studio/lib/studio/systems.ts` currently registers Studio, Asset Factory, Motion, Cinema, Music, Visuals, Spatial, Privacy, Admin, Foundation, and Labs.

## Remaining handoff gap

The registry does not yet explicitly list these connected systems:

- Analytics
- Jobs runtime
- Content
- Marketing
- Investors
- B2B portal

These systems are known URAI repos/surfaces and should appear in Studio's system registry or in a dedicated handoff registry so the dashboard accurately represents the full system-of-systems boundary.

## Patch attempt result

A direct connector update to `apps/studio/lib/studio/systems.ts` was attempted during this audit, but the connector blocked the file replacement. No source claim is made for that attempted patch.

## Acceptance criteria

Studio handoff is complete when one of the following is true:

1. `apps/studio/lib/studio/systems.ts` explicitly registers Analytics, Jobs runtime, Content, Marketing, Investors, and B2B portal; or
2. Studio introduces a dedicated integration handoff registry that lists those systems and is rendered or checked by the Studio dashboard/tests.

## Required verification after patch

```bash
cd ~/urai-studio
corepack enable
corepack prepare pnpm@9.7.0 --activate
pnpm install --frozen-lockfile
pnpm run release:check
```
