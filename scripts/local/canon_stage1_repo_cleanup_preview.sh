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

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$ROOT" ] || die "not inside a git repository"
cd "$ROOT"

[ -f package.json ] || die "missing root package.json"
[ -f apps/studio/package.json ] || die "missing apps/studio/package.json"
[ -f firebase.json ] || die "missing firebase.json"

node - <<'NODE'
const fs = require('fs');
function read(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
const root = read('package.json');
const studio = read('apps/studio/package.json');
const firebase = read('firebase.json');
if (root.name !== 'urai-studio-monorepo') {
  console.error(`unexpected root package name: ${root.name}`);
  process.exit(1);
}
if (studio.name !== 'studio') {
  console.error(`unexpected apps/studio package name: ${studio.name}`);
  process.exit(1);
}
if (!firebase.hosting || firebase.hosting.source !== 'apps/studio') {
  console.error('firebase hosting.source is not apps/studio');
  process.exit(1);
}
if (!firebase.functions || firebase.functions.source !== 'functions') {
  console.error('firebase functions.source is not functions');
  process.exit(1);
}
console.log('[INFO] canonical ownership verified');
NODE

echo "[INFO] stage1 cleanup preview targets"
{
  git ls-files -- 'uraistudio-app/**' 'uraistudio-app'
  git ls-files -- '.bak/**' '.bak'
  git ls-files -- 'tmp/**' 'tmp'
  git ls-files -- '*.bak.*' '**/*.bak.*' 'firebase.json.bak.*'
} | awk 'NF' | sort -u

echo

echo "[INFO] preview complete"
echo "[INFO] this script does not modify the repo"
echo "[INFO] canonical keep-set: apps/studio, functions, firebase.json, root workspace files"
