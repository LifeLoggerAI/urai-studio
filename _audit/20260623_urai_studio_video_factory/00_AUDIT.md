# URAI Studio Video Factory Audit

Date: 2026-06-23
Scope: URAI Studio Video Factory layer for the first URAI Replay Teaser template.

## Intent

Make URAI Studio capable of planning and queueing the first system-generated URAI video without creating a second rendering/job architecture.

## Audited source of truth

- Manifest/control layer: `apps/studio/lib/studio-video-factory.ts`
- Queue API: `apps/studio/app/api/studio/video-factory/route.ts`
- Studio UI surface: `apps/studio/app/studio/video-factory/page.tsx`
- Manifest/API regression: `apps/studio/tests/video-factory.test.mjs`
- Page regression: `apps/studio/tests/video-factory-page.test.mjs`

## Current capability

The Video Factory can:

1. Define a canonical video template named `urai-replay-teaser`.
2. Validate that the template does not duplicate `/` and `/home` captures.
3. Validate unique route capture IDs, asset prompt IDs, and shot IDs.
4. Validate that the shot plan totals thirty seconds.
5. Request `mp4`, `srt`, and `json` export targets.
6. Queue a `video_generation` Studio job through the existing `createStudioJob` path.
7. Show a Studio page at `/studio/video-factory` with the template, routes, shots, asset prompts, queue payload, and render prompt.

## No-duplication audit

The implementation intentionally avoids duplicate systems:

- It uses the existing Studio job queue through `createStudioJob`.
- It uses the existing `video_generation` job type.
- It uses the existing export contract shape with `mp4`, `srt`, and `json`.
- It does not create a second render worker or parallel queue.
- It treats `/home` as the canonical Home World capture and guards against capturing both `/` and `/home`.

## Remaining runtime gap

The current layer plans and queues video jobs. It does not yet render final MP4 files by itself. The missing runtime worker is:

`video_generation job -> browser route capture -> frame/clip capture -> subtitles -> ffmpeg/remotion assembly -> mp4/srt/json output -> storage/download URL`

## Verification status

Source-level verification is committed through regression tests. Local runtime verification still requires running the repo commands in the project environment:

```bash
pnpm --filter studio test
pnpm --filter studio typecheck
pnpm --filter studio build
```

## Launch status

- Command/control layer: implemented
- API queue layer: implemented
- Studio visibility page: implemented
- Regression coverage: implemented
- Dashboard discoverability: partial; page is reachable directly at `/studio/video-factory`
- Final MP4 renderer: not implemented yet
