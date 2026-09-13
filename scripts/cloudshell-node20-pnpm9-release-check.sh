#!/usr/bin/env bash
set -euo pipefail

echo "DEPRECATED: Studio release authority now requires Node 22; forwarding to cloudshell-node22-pnpm9-release-check.sh." >&2
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$ROOT/scripts/cloudshell-node22-pnpm9-release-check.sh" "$@"
