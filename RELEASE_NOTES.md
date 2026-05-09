# URAI Studio Release Notes

## System Audit Implementation Pass

### Added

- URAI Studio callable functions for projects, demo seeding, scripts, subtitles, assets, exports, dashboard summaries, and events.
- Firebase Functions v2 callable implementation for Studio system functions.
- Client-side Firebase callable wrapper and callable-backed Studio action panel.
- Studio surfaces for projects, assets, exports, admin QA, settings, and XR readiness.
- Public module routes for dashboard, usage, integrations, settings, admin, and analytics with explicit metadata.
- Legal/static/public routes for privacy, terms, contact, waitlist, demo, status, systems, and system alias with metadata coverage.
- Waitlist form client component separated from server metadata page.
- Contact and waitlist submission APIs with validation, no-store responses, JSON guards, bot honeypot checks, and Firebase Admin persistence fallback.
- Firestore rules for user-owned Studio collections.
- Firestore rules that explicitly deny client SDK access to `waitlist` and `contactMessages`.
- Storage rules for owner-scoped uploads, server-generated outputs, public read-only assets, and membership-gated Studio upload/output paths.
- Firestore indexes for Studio project, asset, scene, scroll, export, and job query patterns.
- System API routes for health, manifest, capabilities, OpenAPI, integrations, readiness, liveness, and Asset Factory health.
- Static Studio smoke test script with route, callable, Firebase rules, Storage rules, documentation, and CI workflow checks.
- `.env.example`.
- System map, audit, Firebase, testing, handoff, release notes, and final audit documentation.
- GitHub Actions workflow for lint, typecheck, test, app build, functions build, and smoke check.

### Changed

- Root `audit` script includes `pnpm studio:smoke`.
- Functions package has build/typecheck coverage.
- Functions index exports the Studio system callable module.
- `FIREBASE.md` documents public submission collections and Storage rule semantics.
- `TESTING.md` and `HANDOFF.md` reflect the current repo state and verification requirements.
- `FINAL_AUDIT_REPORT.md` records each implementation/hardening pass and remaining blockers.

### Verification Status

Not release-locked. The GitHub connector committed files, but this environment could not run the full install/build/test chain because dependency install/build requires a network-enabled checkout.

`LOCK.md` is intentionally absent until verification passes.

### Required Before Release

Run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions install --no-frozen-lockfile
pnpm --dir functions build
pnpm studio:smoke
```

### Release Lock Rule

Only create `LOCK.md` after the required commands pass and the exact command results are recorded.
