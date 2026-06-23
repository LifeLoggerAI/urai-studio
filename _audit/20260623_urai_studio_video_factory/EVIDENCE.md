# URAI Studio Video Factory Evidence

Date: 2026-06-23

Implemented:
- video manifest
- Studio queue API
- Studio page
- regression tests
- audit document

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

Run in Cloud Shell:

```bash
cd ~/urai-studio
pnpm --filter studio test
pnpm --filter studio typecheck
pnpm --filter studio build
```

Next target:
- add the runtime renderer for final video files
- add route capture
- add video assembly
- add output storage links
- link /studio/video-factory from the Studio dashboard
