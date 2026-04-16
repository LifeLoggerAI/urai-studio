#!/usr/bin/env bash
set -Eeuo pipefail

FAILED_LINE=0
FAILED_CMD=""
trap 'FAILED_LINE=$LINENO; FAILED_CMD=$BASH_COMMAND' ERR

on_error() {
  local exit_code=$?
  echo
  echo "[FAIL] line=${FAILED_LINE}"
  echo "[FAIL] cmd=${FAILED_CMD}"
  echo "[FAIL] exit=${exit_code}"
  exit "${exit_code}"
}
trap on_error ERR

die(){ echo "FATAL: $*" >&2; exit 1; }
have(){ command -v "$1" >/dev/null 2>&1; }

have git || die "git is required"
have node || die "node is required"
have pnpm || die "pnpm is required"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$ROOT" ] || die "not inside a git repository"
cd "$ROOT"

[ -f package.json ] || die "missing root package.json"
[ -f apps/studio/package.json ] || die "missing apps/studio/package.json"
[ -f apps/studio/tsconfig.json ] || die "missing apps/studio/tsconfig.json"
[ -f firebase.json ] || die "missing firebase.json"

node - <<'NODE'
const fs = require('fs');
function read(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
const root = read('package.json');
const studio = read('apps/studio/package.json');
const firebase = read('firebase.json');
if (root.name !== 'urai-studio-monorepo') throw new Error(`unexpected root package name: ${root.name}`);
if (studio.name !== 'studio') throw new Error(`unexpected studio package name: ${studio.name}`);
if (!firebase.hosting || firebase.hosting.source !== 'apps/studio') throw new Error('firebase hosting.source is not apps/studio');
if (!firebase.functions || firebase.functions.source !== 'functions') throw new Error('firebase functions.source is not functions');
console.log('[INFO] canonical ownership verified');
NODE

echo "[INFO] pnpm install lockfile-respecting"
pnpm install --frozen-lockfile

echo "[INFO] studio typecheck"
pnpm --filter studio exec tsc --noEmit

echo "[INFO] studio build"
pnpm --filter studio build

if [ -f functions/tsconfig.json ] && [ -f functions/package.json ]; then
  echo "[INFO] functions typecheck"
  pnpm exec tsc --noEmit -p functions/tsconfig.json
else
  echo "[INFO] functions typecheck skipped"
fi

echo "[INFO] stage2 canonical root verification passed"
