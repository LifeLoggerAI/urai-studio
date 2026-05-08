# URAI Studio Production Audit

Date: 2026-05-07
Branch: release/urai-studio-production-lock
App root: apps/studio
Domain target: https://www.uraistudio.com

## What this project is

URAI Studio is the public and professional creative studio layer of the URAI ecosystem. It is intended to operate as a standalone premium web system at www.uraistudio.com and as a typed integration surface for URAI, URAI Spatial, Asset Factory, URAI Jobs, URAI Admin, URAI Analytics, URAI Marketing, URAI Privacy, URAI Investors, and URAI Foundation.

## Repository discovery

- Repository: LifeLoggerAI/urai-studio
- Default branch: main
- Safe release branch: release/urai-studio-production-lock
- Primary app root: apps/studio
- Framework: Next.js app router
- Package manager: pnpm
- Root scripts now include build, dev, lint, typecheck, test, smoke, audit, release:check
- Studio app scripts include build, dev, lint, test, smoke, typecheck

## Complete / present

- Next.js app root in apps/studio
- Root and app package.json files
- Studio module registry in apps/studio/lib/studio/modules.ts
- System types in apps/studio/lib/studio/types.ts
- System API routes for health, manifest, capabilities, integration contract, and OpenAPI
- Public pages for home, studio, assets, jobs, privacy, status, system, dashboard, settings, usage, integrations, module routes, and contact
- Firebase dependency footprint and deployment intent
- Existing CI commit on main before this branch

## Partial / improved in this branch

- Navigation was aligned to production routes: Studio, Generate, Assets, Jobs, Pricing, About, Status, System, Contact
- Footer was aligned to production and legal routes
- Missing public routes were added: /about, /pricing, /generate, /terms
- /privacy was replaced with a production policy scaffold instead of a generic module shell
- Capabilities and manifest APIs were normalized to include ok/service metadata
- Integration contract API was expanded to include domain, app root, routes, endpoints, auth requirements, environment variables, connected systems, lifecycle contracts, health guarantees, deployment target, rollback, and limitations
- Root release and smoke scripts were added

## Not started / still blocked

- Live Firebase deploy from this chat environment
- Live www.uraistudio.com smoke verification
- Real generation queue wiring; currently feature-gated behind STUDIO_GENERATION_ENDPOINT and STUDIO_GENERATION_API_KEY
- Real Stripe checkout; currently feature-gated behind Stripe env configuration
- Real auth and tenant scoping for private dashboards and generated assets
- Production legal counsel review for privacy and terms
- Full local pnpm install/build/test execution from a cloned workspace

## Risks found

- Existing route smoke test was declarative only and did not fetch live routes
- Several system API responses did not consistently include ok/service fields
- Some visible navigation pointed to older demo/waitlist/system routes rather than the requested production map
- Billing and generation should remain feature-gated until real secrets and backend services are configured

## Recommended verification

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

After deployment:

```bash
HOST=https://www.uraistudio.com bash scripts/smoke.sh
```
