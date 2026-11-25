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
npm --prefix functions ci --include=dev

echo "[preflight] functions build"
npm --prefix functions run build

echo "[preflight] smoke"
pnpm studio:smoke

echo "[preflight] complete. If every command above passed in CI or a network-enabled checkout, record exact output before creating LOCK.md."
