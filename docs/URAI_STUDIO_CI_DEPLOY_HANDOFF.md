# URAI Studio CI and Deploy Handoff

This handoff records the exact verification path that remains outside repo-only editing. It does not mark CI or deployment complete by itself.

## Repo-side checks already wired

Run from the repository root:

```bash
corepack prepare pnpm@9.7.0 --activate
pnpm install --no-frozen-lockfile
pnpm audit
pnpm release:check
```

`pnpm audit` includes the done-done guard, release evidence schema guard, health summary guard, lint, typecheck, tests, and Studio smoke.

`pnpm release:check` includes the audit, Studio app build, and Functions build.

## GitHub Actions checks to verify

Check the current commit for:

- `Studio Audit`
- `Studio Health Guard`

The focused health workflow runs `scripts/health-summary-guard.mjs`. The main audit workflow still runs the broader install, guard, lint, typecheck, test, build, Functions build, and smoke sequence. If the main workflow is edited later, keep the health guard in either the main audit workflow or the focused health workflow.

## Deployment evidence to record

After the app is deployed, copy `docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md` into a dated evidence note and fill it with observed output.

Required observed fields:

- current commit SHA
- install result
- audit result
- release check result
- deployment target
- deployed base URL
- health endpoint response
- system manifest response
- Spatial handoff response
- Studio export response

## Remote endpoint checks

Use the deployed base URL and verify these endpoints manually or through CI tooling that has permission to make network requests:

```bash
BASE_URL="https://REPLACE_WITH_DEPLOYED_STUDIO_URL"
curl -fsS "$BASE_URL/api/system/health"
curl -fsS "$BASE_URL/api/system/manifest"
curl -fsS "$BASE_URL/api/system/spatial-handoff"
curl -fsS "$BASE_URL/api/studio/exports"
```

The expected result is not just HTTP success. The responses must show that Studio is reporting its integration summary, system manifest, fallback-safe Spatial handoff contract, and export handoff field.

## Final lock rule

Do not claim Studio is production locked until the observed CI results and remote endpoint checks are recorded with the deployed commit SHA.
