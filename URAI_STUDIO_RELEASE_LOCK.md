# URAI Studio Release Lock

Date/time UTC: 2026-05-07
Branch: release/urai-studio-production-lock
Base commit: bedf8b1f3a465a59c716238ed39169870dffad22
App root: apps/studio
Framework: Next.js app router
Package manager: pnpm
Domain target: https://www.uraistudio.com
Deployment target: Firebase Hosting or Firebase App Hosting

## Production route lock

Public routes expected for smoke coverage:

- /
- /studio
- /generate
- /assets
- /jobs
- /pricing
- /about
- /privacy
- /terms
- /status
- /system

System API routes expected for smoke coverage:

- /api/system/health
- /api/system/manifest
- /api/system/capabilities
- /api/system/integration-contract
- /api/system/openapi

## Completed in this lock branch

- Created safe release branch from latest main Studio CI commit.
- Aligned Header navigation to the production map.
- Aligned Footer navigation to production and legal routes.
- Added /about page.
- Added /pricing page with billing feature gate.
- Added /generate page with generation feature gate.
- Added /terms page.
- Replaced /privacy shell with production privacy scaffold.
- Expanded /api/system/integration-contract.
- Normalized /api/system/manifest.
- Normalized /api/system/capabilities.
- Added root scripts: smoke, audit, release:check.
- Added scripts/smoke.sh.
- Added URAI_STUDIO_AUDIT.md.

## Commands to run before merge/deploy

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
HOST=http://127.0.0.1:3000 bash scripts/smoke.sh
pnpm release:check
```

## Live verification after deploy

```bash
HOST=https://www.uraistudio.com bash scripts/smoke.sh
```

Also verify:

- Canonical domain resolves to https://www.uraistudio.com
- Root domain redirects to www where hosting supports it
- robots and sitemap are reachable
- Open Graph image route renders
- Mobile viewport has no horizontal overflow
- No browser console errors on primary pages

## Pass / fail status

- install: NOT RUN in this chat environment
- lint: NOT RUN in this chat environment
- typecheck: NOT RUN in this chat environment
- test: NOT RUN in this chat environment
- build: NOT RUN in this chat environment
- local smoke: SCRIPT ADDED, NOT RUN in this chat environment
- deploy: NOT RUN in this chat environment
- live smoke: NOT RUN in this chat environment

## Known limitations

- Live generation is feature-gated until STUDIO_GENERATION_ENDPOINT and STUDIO_GENERATION_API_KEY are configured and the StudioJob queue is wired.
- Billing is feature-gated until Stripe products, checkout, billing portal, and webhook signature verification are configured.
- Private dashboards, generated asset downloads, admin controls, and tenant data must remain protected until auth and tenant scoping are verified.
- Privacy and terms pages are production-ready scaffolds and should receive legal review before broad commercial launch.
- This branch was edited through the GitHub connector; full local install/build/test/deploy commands still need to be executed in CI or a development clone.

## Deployment command

Use the configured Firebase workflow after checks pass, for example:

```bash
pnpm release:check
firebase deploy
```

or the repository's Firebase App Hosting workflow if App Hosting is the active target.

## Rollback instructions

Redeploy the previous verified Firebase Hosting/App Hosting release or revert this branch merge commit and redeploy main.

## Final status

PARTIAL: code and documentation improvements were committed to a safe release branch. Full PASS requires CI/local verification and live deployment smoke testing.
