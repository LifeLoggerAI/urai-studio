#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[preflight] URAI Studio release preflight"

echo "[preflight] doctor"
pnpm run studio:doctor

echo "[preflight] lint"
pnpm lint

echo "[preflight] typecheck"
pnpm typecheck

echo "[preflight] tests"
pnpm test

echo "[preflight] app build"
pnpm build

echo "[preflight] functions install"
pnpm --dir functions install --no-frozen-lockfile

echo "[preflight] functions build"
pnpm --dir functions build

echo "[preflight] smoke"
pnpm studio:smoke

echo "[preflight] complete. If every command above passed in CI or a network-enabled checkout, record exact output before creating LOCK.md."
