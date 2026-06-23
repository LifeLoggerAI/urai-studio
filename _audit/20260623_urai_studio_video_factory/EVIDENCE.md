# URAI Studio Video Factory Evidence

Date: 2026-06-23

Implemented:
- video manifest
- Studio queue API
- Studio page
- regression tests
- audit document
- renderer package
- render package smoke test
- route capture worker

Checks covered:
- /home is canonical Home World capture
- / and /home are not both captured
- route capture IDs and paths are unique
- asset prompt IDs are unique
- shot IDs are unique
- duration totals thirty seconds
- exports include mp4, srt, and json
- API validates before queueing
- API uses the existing Studio job path
- renderer builds route capture plan
- renderer builds subtitle text
- renderer builds export manifest
- renderer records planned output artifact paths
- capture worker reads routes from the canonical manifest source
- capture worker writes screenshot and report evidence

Run in Cloud Shell:

```bash
cd ~/urai-studio
pnpm --filter studio test
pnpm --filter studio typecheck
pnpm --filter studio build
node scripts/studio-video-route-capture.mjs
```

Video Factory source proof:

- apps/studio/lib/studio-video-factory.ts
- apps/studio/lib/studio-video-renderer.ts
- apps/studio/app/api/studio/video-factory/route.ts
- apps/studio/app/studio/video-factory/page.tsx
- apps/studio/tests/video-factory.test.mjs
- apps/studio/tests/video-factory-page.test.mjs
- apps/studio/tests/video-render-package.test.mjs
- scripts/studio-video-route-capture.mjs

Next target:
- add final file composition worker
- add output storage links
- link /studio/video-factory from the Studio dashboard
