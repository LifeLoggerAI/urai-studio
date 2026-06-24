#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export NEXT_TELEMETRY_DISABLED=1
export CI=1

echo "== URAI Studio Cloud Shell proof =="
echo "repo: $ROOT"

echo "== disk before cleanup =="
df -h . "$HOME" || true

echo "== cleanup low-disk build/cache artifacts =="
rm -rf \
  .next node_modules/.cache \
  apps/studio/.next apps/studio/node_modules/.cache \
  functions/lib functions/node_modules/.cache \
  packages/*/node_modules/.cache \
  "$HOME/.npm/_cacache" \
  "$HOME/.cache/node/corepack" \
  "$HOME/.cache/ms-playwright" \
  /tmp/next-* /tmp/playwright-* 2>/dev/null || true

pnpm store prune || true

echo "== disk after cleanup =="
df -h . "$HOME" || true

echo "== provider readiness =="
pnpm provider:check

echo "== audit gates =="
pnpm done-done:guard
pnpm evidence:guard
pnpm health:guard
pnpm lint
pnpm typecheck
pnpm test
pnpm studio:smoke

echo "== build proof =="
pnpm build
pnpm --dir functions build

echo "URAI Studio Cloud Shell proof complete."
