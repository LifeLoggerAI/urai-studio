# URAI Studio publish runbook

Date: 2026-06-30

Purpose: make the current repo state publishable from a credentialed workstation or CI runner without weakening the release gate.

## Required release gate

Run from a clean checkout of `main`:

```bash
set -euo pipefail
corepack enable || true
corepack prepare pnpm@9.7.0 --activate
pnpm install --no-frozen-lockfile
pnpm release:check
```

`pnpm release:check` includes the audit chain, app build, and Functions build.

## Publish command

After the release gate passes in the credentialed environment, publish with the configured Firebase project:

```bash
pnpm exec firebase deploy --project "$FIREBASE_PROJECT_ID"
```

Do not commit service account files, private keys, tokens, or generated credential material.

## Live smoke command

After publish, record these results:

```bash
HOST=https://www.uraistudio.com bash scripts/smoke.sh
curl -I -L --max-time 20 https://www.uraistudio.com
curl -I -L --max-time 20 https://www.uraistudio.com/healthz
curl -I -L --max-time 20 https://www.uraistudio.com/readyz
curl -I -L --max-time 20 https://www.uraistudio.com/api/health
curl -I -L --max-time 20 https://www.uraistudio.com/status
```

## Receipt requirements

Attach or paste the following before marking Studio READY:

- commit SHA deployed
- release gate output
- deploy output and deploy identifier
- live smoke output
- protected route auth-denial proof
- timestamp in UTC

## Current status

Do not mark READY until the release gate, publish, and live smoke receipts exist for the deployed commit.
