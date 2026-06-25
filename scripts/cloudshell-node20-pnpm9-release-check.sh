#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== URAI Studio Cloud Shell release helper =="
echo "repo: $ROOT"
echo "required: node >=20 <21, pnpm 9.7.0"
echo "current node: $(node -v 2>/dev/null || echo missing)"
echo "current pnpm: $(pnpm -v 2>/dev/null || echo missing)"

run_release() {
  echo "node: $(node -v)"
  echo "pnpm: $(pnpm -v)"
  pnpm install --frozen-lockfile
  pnpm release:check
}

node_major="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"

if [[ "$node_major" == "20" ]]; then
  corepack prepare pnpm@9.7.0 --activate
  run_release
  exit 0
fi

if command -v nvm >/dev/null 2>&1; then
  echo "Using nvm to enter Node 20."
  nvm install 20
  nvm use 20
  corepack prepare pnpm@9.7.0 --activate
  run_release
  exit 0
fi

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  echo "Loading nvm from ~/.nvm/nvm.sh."
  # shellcheck disable=SC1091
  source "$HOME/.nvm/nvm.sh"
  nvm install 20
  nvm use 20
  corepack prepare pnpm@9.7.0 --activate
  run_release
  exit 0
fi

if command -v nix-shell >/dev/null 2>&1; then
  echo "Using nix-shell with nodejs_20 and corepack."
  nix-shell -p nodejs_20 -p corepack --run 'corepack prepare pnpm@9.7.0 --activate && node -v && pnpm -v && pnpm install --frozen-lockfile && pnpm release:check'
  exit 0
fi

cat <<'EOF'
Could not find nvm or nix-shell to enter Node 20 automatically.
Run one of these manually, then rerun this script:

  nvm install 20
  nvm use 20
  corepack prepare pnpm@9.7.0 --activate
  pnpm install --frozen-lockfile
  pnpm release:check

or, on Nix systems:

  nix-shell -p nodejs_20 -p corepack --run 'corepack prepare pnpm@9.7.0 --activate && pnpm install --frozen-lockfile && pnpm release:check'
EOF
exit 1
