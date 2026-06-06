# URAI Studio Deployment Verification

This is the canonical checklist for proving the repo is deployed and working live.

## Required local/CI checks before deploy

Run from the repository root:

```bash
pnpm install --no-frozen-lockfile
pnpm done-done:guard
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions install --no-frozen-lockfile
pnpm --dir functions build
pnpm studio:smoke
```

Equivalent one-command gate:

```bash
pnpm release:check
```

## Required live smoke after deploy

For production readiness:

```bash
HOST=https://www.uraistudio.com EXPECT_READY=true pnpm smoke
```

If Firebase Admin or readiness credentials are intentionally not configured yet, use this only as a partial verification:

```bash
HOST=https://www.uraistudio.com EXPECT_READY=false pnpm smoke
```

Partial verification means the public routes and safe system APIs respond, but the deployment is not fully ready.

## GitHub Actions verification

Use these workflows:

- `Studio Audit` runs on push to `main`, pull requests into `main`, and manual dispatch.
- `Live Smoke` runs manually against a supplied host.

Manual live smoke inputs:

- `host`: `https://www.uraistudio.com`
- `expect_ready`: `true` for full production readiness, `false` for partial readiness.

## Live smoke coverage

The live smoke script verifies:

- public HTML routes render with required page markers;
- public API routes return safe JSON;
- no obvious secret strings are exposed;
- `/api/system/health` identifies `urai-studio`;
- `/api/system/urai-contract` exposes the runtime URAI contract;
- `/api/system/integration-contract` advertises runtime contract, job, and export APIs;
- `/api/studio/jobs` and `/api/studio/exports` expose tenant-scoped contract metadata;
- invalid waitlist, contact, job, and export requests fail safely with `400`;
- `/readyz` passes when `EXPECT_READY=true`.

## Done-done verification standard

A deployment is live-working verified only when all are true:

1. `Studio Audit` passes on the commit deployed to production.
2. The hosting provider confirms production is serving that commit or an equivalent build artifact.
3. `Live Smoke` passes against `https://www.uraistudio.com` with `EXPECT_READY=true`.
4. Firebase Admin-backed persistence is configured for production.
5. A real Studio job can be created and listed under a tenant-scoped record.
6. A real Studio export can be queued with `tenantScoped=true`.
7. No live route exposes debug, placeholder, test-mode, or secret content.

## Current blocker language

If any of the checks above are missing, say:

> URAI Studio is repo-hardened and deployment-ready, but not yet live-working verified for done-done status.

Do not claim live-working verified until the required workflow evidence exists.
