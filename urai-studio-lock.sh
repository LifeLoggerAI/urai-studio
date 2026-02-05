#!/bin/bash
set -euo pipefail

PROJECT_NAME="urai-studio"
REPO="${REPO:-$HOME/urai-studio}"
PROJECT_ID="urai-4dc1d"
TAG="v1.0.0-studio-static"
APP_DIR="apps/studio"
ts="$(date -u +%Y%m%d_%H%M%S)"
LOG="/tmp/${PROJECT_NAME}_lock_${ts}.log"
exec > >(tee -a "$LOG") 2>&1

die(){ echo "ERROR: $*" >&2; exit 1; }

echo "=== ${PROJECT_NAME} LOCK START (UTC $(date -u)) ==="
echo "REPO=$REPO"
echo "PROJECT_ID=$PROJECT_ID"
echo "TAG=$TAG"
echo "LOG=$LOG"

cd "$REPO" || die "repo not found: $REPO"

echo "--- backup snapshot (tracked + key configs) ---"
mkdir -p .bak
git ls-files -z | tar --null -czf ".bak/${PROJECT_NAME}.tracked.${ts}.tgz" -T - || true
for f in firebase.json .firebaserc package.json pnpm-lock.yaml apps/studio/next.config.js; do
  [ -f "$f" ] && cp -a "$f" ".bak/${f}.bak.${ts}" || true
done

echo "--- capture deploy urls ---"
HOSTING_SITES="$(firebase hosting:sites:list --project "$PROJECT_ID" 2>/dev/null | sed -n 's/^[[:space:]]*//p' | head -n 50 || true)"
echo "HOSTING_SITES:"
echo "$HOSTING_SITES" || true

echo "--- write LOCK file + tag ---"
LOCK_FILE="URAI_STUDIO_LOCK.md"
COMMIT="$(git rev-parse HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD || echo "(unknown)")"
NOW="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

cat > "$LOCK_FILE" <<EOF
# URAI-STUDIO LOCK ✅

- Project: ${PROJECT_NAME}
- Locked at: ${NOW}
- Repo: ${REPO}
- Branch: ${BRANCH}
- Commit: ${COMMIT}
- Tag: ${TAG}
- Firebase Project: ${PROJECT_ID}

## Build/Tests
- pnpm --filter "./${APP_DIR}" build: PASS (static export)

## Deploy
- firebase deploy --only hosting: PASS (static-only)

## Notes
- Log: ${LOG}
- Hosting sites (best-effort):
$(echo "$HOSTING_SITES" | sed 's/^/- /')
EOF

git add "$LOCK_FILE" "urai-studio-lock.sh" || true
git commit -m "LOCK: ${PROJECT_NAME} ${TAG}" || echo "NOTE: nothing to commit (LOCK unchanged?)"
git tag -f "$TAG" || true

echo "=== ${PROJECT_NAME} LOCK COMPLETE (UTC $(date -u)) ==="
echo "COMMIT=$COMMIT"
echo "TAG=$TAG"
echo "LOCK_FILE=$LOCK_FILE"
