#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${OUT_DIR:-launch-evidence}"
HOST="${HOST:-http://127.0.0.1:3000}"
mkdir -p "$OUT_DIR"

{
  echo "# URAI Studio Launch Evidence"
  echo
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Host: $HOST"
  echo
  echo "## Git"
  git rev-parse HEAD || true
  git status --short || true
  echo
  echo "## Commands"
  echo "pnpm lint"
  echo "pnpm typecheck"
  echo "pnpm test"
  echo "pnpm build"
  echo "pnpm --dir functions build"
  echo "pnpm studio:smoke"
} > "$OUT_DIR/README.md"

run_and_log() {
  local name="$1"
  shift
  echo "[launch-evidence] running $name"
  if "$@" > "$OUT_DIR/$name.log" 2>&1; then
    echo "PASS $name" >> "$OUT_DIR/summary.txt"
  else
    echo "FAIL $name" >> "$OUT_DIR/summary.txt"
    return 1
  fi
}

: > "$OUT_DIR/summary.txt"
run_and_log lint pnpm lint
run_and_log typecheck pnpm typecheck
run_and_log test pnpm test
run_and_log build pnpm build
run_and_log functions-build pnpm --dir functions build
run_and_log studio-smoke pnpm studio:smoke

if command -v curl >/dev/null 2>&1; then
  for route in / /studio /admin /studio/admin /status /api/system/health /readyz; do
    safe_name=$(echo "$route" | sed 's#/#_#g; s#^_##; s#_$##')
    safe_name=${safe_name:-home}
    curl -i -L --max-time 15 "$HOST$route" > "$OUT_DIR/http-$safe_name.txt" 2>&1 || true
  done
fi

echo "[launch-evidence] wrote $OUT_DIR"
