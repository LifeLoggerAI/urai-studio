#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

failures=0

check_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "[doctor] missing file: $file"
    failures=$((failures + 1))
  else
    echo "[doctor] ok file: $file"
  fi
}

check_dir() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    echo "[doctor] missing directory: $dir"
    failures=$((failures + 1))
  else
    echo "[doctor] ok directory: $dir"
  fi
}

check_contains() {
  local file="$1"
  local token="$2"
  if [[ ! -f "$file" ]]; then
    echo "[doctor] cannot inspect missing file: $file"
    failures=$((failures + 1))
    return
  fi
  if ! grep -Fq "$token" "$file"; then
    echo "[doctor] missing token in $file: $token"
    failures=$((failures + 1))
  else
    echo "[doctor] ok token in $file: $token"
  fi
}

echo "[doctor] URAI Studio workspace doctor"
echo "[doctor] root: $ROOT_DIR"

check_file package.json
check_file pnpm-workspace.yaml
check_file firebase.json
check_file apphosting.yaml
check_file .idx/dev.nix
check_file .npmrc
check_file scripts/firebase-studio-repair.sh
check_file docs/firebase-studio-recovery.md
check_file apps/studio/package.json
check_file functions/package.json
check_dir apps/studio/app
check_dir functions/src

check_contains package.json '"node": ">=20 <21"'
check_contains package.json '"pnpm": "9.7.0"'
check_contains package.json 'studio:repair'
check_contains package.json 'studio:preview'
check_contains package.json 'studio:doctor'
check_contains package.json '"react": "^19.0.0"'
check_contains package.json '"react-dom": "^19.0.0"'
check_contains apps/studio/package.json '"next": "16.1.6"'
check_contains apps/studio/package.json '"react": "^19.0.0"'
check_contains apps/studio/package.json '"react-dom": "^19.0.0"'
check_contains .idx/dev.nix 'pnpm install --no-frozen-lockfile'
check_contains .idx/dev.nix 'pnpm -C apps/studio dev'
check_contains apphosting.yaml 'runtime: nodejs20'
check_contains firebase.json '"source": "apps/studio"'
check_contains firebase.json '"source": "functions"'

if command -v node >/dev/null 2>&1; then
  node_major="$(node -v | sed 's/^v//' | cut -d. -f1)"
  echo "[doctor] node: $(node -v)"
  if [[ "$node_major" != "20" ]]; then
    echo "[doctor] expected Node 20.x, got $(node -v)"
    failures=$((failures + 1))
  fi
else
  echo "[doctor] node is not installed"
  failures=$((failures + 1))
fi

if command -v pnpm >/dev/null 2>&1; then
  echo "[doctor] pnpm: $(pnpm --version)"
else
  echo "[doctor] pnpm is not active yet; run pnpm run studio:repair or corepack prepare pnpm@9.7.0 --activate"
  failures=$((failures + 1))
fi

if [[ "$failures" -gt 0 ]]; then
  echo "[doctor] failed with $failures issue(s)"
  exit 1
fi

echo "[doctor] workspace contract passed"
