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
HOST=https://www.uraistudio.com EXPECT_READY=true EXPECT_PROTECTED_AUTH=true pnpm smoke
```

If Firebase Admin or readiness credentials are intentionally not configured yet, use this only as a partial verification:

```bash
HOST=https://www.uraistudio.com EXPECT_READY=false EXPECT_PROTECTED_AUTH=true pnpm smoke
```

Partial verification means the public routes and safe system APIs respond and protected APIs reject unauthenticated requests, but the deployment is not fully ready.

For local development only, protected APIs may use the local fallback mode:

```bash
HOST=http://127.0.0.1:3000 EXPECT_READY=false EXPECT_PROTECTED_AUTH=false pnpm smoke
```

## GitHub Actions verification

Use these workflows:

- `Studio Audit` runs on push to `main`, pull requests into `main`, and manual dispatch.
- `Live Smoke` runs manually against a supplied host.

Manual live smoke inputs:

- `host`: `https://www.uraistudio.com`
- `expect_ready`: `true` for full production readiness, `false` for partial readiness.
- `expect_protected_auth`: `true` for production. This requires unauthenticated protected Studio APIs to return `401`.

## Live smoke coverage

The live smoke script verifies:

- public HTML routes render with required page markers;
- public API routes return safe JSON;
- no obvious secret strings are exposed;
- `/api/system/health` identifies `urai-studio`;
- `/api/system/urai-contract` exposes the runtime URAI contract;
- `/api/system/integration-contract` advertises runtime contract, job, and export APIs;
- `/api/studio/jobs` and `/api/studio/exports` reject unauthenticated production requests with `401` when `EXPECT_PROTECTED_AUTH=true`;
- local fallback can still validate contract metadata when `EXPECT_PROTECTED_AUTH=false`;
- invalid waitlist and contact requests fail safely with `400`;
- `/readyz` passes when `EXPECT_READY=true`.

## Done-done verification standard

A deployment is live-working verified only when all are true:

1. `Studio Audit` passes on the commit deployed to production.
2. The hosting provider confirms production is serving that commit or an equivalent build artifact.
3. `Live Smoke` passes against `https://www.uraistudio.com` with `EXPECT_READY=true` and `EXPECT_PROTECTED_AUTH=true`.
4. Firebase Admin-backed persistence is configured for production.
5. Unauthenticated protected Studio APIs return `401` in production.
6. A real authenticated Studio job can be created and listed under a tenant-scoped record.
7. A real authenticated Studio export can be queued with `tenantScoped=true`.
8. No live route exposes debug, placeholder, test-mode, or secret content.

## Current blocker language

If any of the checks above are missing, say:

> URAI Studio is repo-hardened and deployment-ready, but not yet live-working verified for done-done status.

Do not claim live-working verified until the required workflow evidence exists.
