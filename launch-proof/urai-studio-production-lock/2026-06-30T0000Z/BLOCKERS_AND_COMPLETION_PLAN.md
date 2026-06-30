# URAI Studio blockers and completion plan

Recorded: 2026-06-30

## P0 blockers — must clear before READY

1. Run and capture clean release gates on current commit:
   - install
   - done-done guard
   - evidence guard
   - health guard
   - lint
   - typecheck
   - tests
   - app build
   - Functions build
   - local smoke
2. Verify live deployment target and deployed commit SHA.
3. Run live smoke against production URL, including health, system manifest, Spatial handoff, jobs auth-denied, exports auth-denied, waitlist/contact safe submissions if configured.
4. Wire or explicitly keep gated all real provider generation features.
5. Replace fallback-only job runner path with a real queue/provider pipeline or relabel it as non-production QA/demo only.
6. Complete production export/download authorization and storage persistence proof.
7. Prove production auth/tenant membership enforcement for private dashboards, jobs, assets, exports, and admin controls.
8. Add app/server upload validation for type, size, auth, storage path, and malware/abuse boundaries before accepting production uploads.

## P1 blockers — required for 100% creator studio

1. Real project workspace UX: create, edit, load, save, delete, and list with uid/tenant protection.
2. Real asset import flow with signed upload or server upload broker.
3. Real generation adapter interface with provider capability flags and safe failure modes.
4. Real asset persistence model: StudioAsset records tied to storage objects and job outputs.
5. Real export processor: JSON, storyboard markdown, captions, asset manifest, Spatial manifest, downloadable package.
6. Provider/account readiness route that blocks claims when env/config is missing.
7. Billing/usage metering if premium provider calls are exposed.
8. Admin role UI backed by custom claims or membership roles, not only env flag visibility.

## P2 improvements

1. Better user-visible empty states and demo/real labeling across Studio pages.
2. Route-level e2e screenshots for public/admin-gated pages.
3. Integration contract smoke tests for asset-factory, content, jobs, analytics, marketing, spatial, privacy, admin, investors, and B2B URLs.
4. Deploy evidence ledger automation from CI.
5. Add live read-only diagnostics page showing build SHA, deployment timestamp, feature flags, and provider readiness.

## P3 polish

1. Remove old backup/deprecated roots or keep them isolated behind automated guards.
2. Reduce duplicate docs and consolidate canonical audit index.
3. Add visual regression for public Studio surface.
4. Add operator runbooks for incident recovery, rollbacks, and failed job replay.

## Path to 100%

### Phase 1 — evidence lock

Run the full release command path in a real terminal/CI environment and attach logs to this proof folder. Confirm latest commit SHA after these proof docs and run all checks against that exact SHA.

### Phase 2 — truthful feature gating

Ensure every unfinished editor/generation/publish/admin control is disabled or labeled fallback/demo/contract-only in production. Keep admin QA disabled by default.

### Phase 3 — real persistence and job lifecycle

Unify `studioJobs` and legacy `jobs`/`assetJobs` job paths or document the separation clearly. Queue a real job, process it, persist output assets, record events, and verify tenant-scoped reads.

### Phase 4 — real generation and export

Add provider adapters, env readiness checks, safe prompt validation, output asset persistence, export bundle generation, signed download/revocation, and acceptance tests.

### Phase 5 — live production proof

Deploy the verified commit, smoke `https://www.uraistudio.com`, attach output, and update release evidence ledger. Only then mark READY.

## Current lock language

Use: `URAI Studio is a guarded Studio foundation with route coverage, Firebase-backed records, admin QA gating, and fallback-safe system/spatial handoff contracts.`

Do not use yet: `URAI Studio is production-ready`, `live AI media generation studio`, `complete publishing platform`, or `fully locked`.