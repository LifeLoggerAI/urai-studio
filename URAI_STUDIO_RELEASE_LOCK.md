# URAI Studio Release Lock

Date/time UTC: 2026-05-07T00:00:00Z
Branch: release/urai-studio-polish-e2e
Base commit SHA: bedf8b1f3a465a59c716238ed39169870dffad22
Target domain: https://www.uraistudio.com
Repository: LifeLoggerAI/urai-studio
App root: apps/studio
Framework: Next.js App Router
Package manager: pnpm
Firebase hosting target: urai-studio / Firebase App Hosting or Hosting config as present in repository

## Routes verified by design

HTML routes added or confirmed for the standalone production surface:

- /
- /studio
- /generate
- /assets
- /pricing
- /about
- /privacy
- /terms

System API routes added or normalized:

- /api/system/health
- /api/system/manifest
- /api/system/capabilities
- /api/system/integration-contract

## Commands to run locally or in CI

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
HOST=http://127.0.0.1:3000 bash scripts/smoke.sh
pnpm release:check
```

## Status matrix

| Check | Status | Notes |
| --- | --- | --- |
| install | Not run in this environment | Container DNS blocked direct GitHub clone/install. Run in CI or local shell. |
| lint | Not run in this environment | CI workflow exists and should run on PR/push. |
| typecheck | Not run in this environment | CI workflow exists and should run on PR/push. |
| test | Not run in this environment | Existing module/openapi tests preserved. |
| build | Not run in this environment | CI workflow exists and should run on PR/push. |
| smoke | Added | scripts/smoke.sh validates required HTML/API routes against a running host. |

## Completed in this lock

- Added root `smoke`, `audit`, and `release:check` scripts.
- Added `/generate` as a safe feature-gated creative intake page.
- Added `/pricing` without fake checkout claims.
- Added `/about` explaining URAI Studio as standalone and system-of-systems layer.
- Added `/terms` as a safe production placeholder pending legal review.
- Added deterministic `scripts/smoke.sh` route/API verification.
- Added explicit home page smoke marker.
- Normalized `/api/system/capabilities` with `ok` and `service`.
- Expanded `/api/system/integration-contract` with domain, connected systems, auth posture, health guarantees, and smoke coverage.

## Known limitations

- Local clone/install/build/smoke could not be executed from this assistant environment because DNS resolution for github.com was unavailable in the execution container.
- Stripe or live checkout was not wired because no active production billing configuration was verified.
- Generation submission remains feature-gated until a live Asset Factory/render queue endpoint is configured.
- Domain DNS and Firebase custom domain attachment must be verified from Firebase Console or deploy environment.

## Deployment command

```bash
pnpm install --frozen-lockfile
pnpm release:check
firebase deploy --only hosting
```

If Firebase App Hosting is the selected target for this app, deploy through the configured App Hosting backend for `apps/studio` and set `NEXT_PUBLIC_SITE_URL=https://www.uraistudio.com`.

## Rollback

```bash
git checkout main
git revert <merge_commit_sha>
firebase hosting:clone <source_site>:<source_version> urai-studio:live
```

Replace `<merge_commit_sha>`, `<source_site>`, and `<source_version>` with the production release values from GitHub and Firebase Hosting history.
