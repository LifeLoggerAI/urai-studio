#!/usr/bin/env bash
set -euo pipefail

echo "[urai-studio] Starting Firebase Studio repair"

if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@9.7.0 --activate || true
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[urai-studio] pnpm not found; installing pnpm@9.7.0 globally"
  npm i -g pnpm@9.7.0
fi

echo "[urai-studio] Removing stale install/build artifacts"
rm -rf node_modules apps/studio/node_modules packages/*/node_modules apps/studio/.next .next

echo "[urai-studio] Installing dependencies"
pnpm install --no-frozen-lockfile

echo "[urai-studio] Building Studio app"
pnpm --filter studio build

echo "[urai-studio] Static smoke check"
pnpm studio:smoke

echo "[urai-studio] Repair complete. Start preview with: pnpm run studio:preview"
