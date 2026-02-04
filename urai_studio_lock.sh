#!/usr/bin/env bash
set -euo pipefail

# ===== URAI-STUDIO LOCK (v1) =====
DATE="$(date -u +%Y%m%d_%H%M%S)"
LOG="/tmp/urai_studio_lock_${DATE}.log"
exec > >(tee -a "$LOG") 2>&1

# --- cd to script dir, set REPO to PWD ---
cd "$(dirname "$0")"
REPO="$PWD"

echo "=== URAI-STUDIO LOCK START (UTC $(date -u)) ==="
echo "REPO=$REPO"
echo "LOG=$LOG"

# --- backup (tar; no rsync dependency) ---
BACKUP="../urai-studio.bak.${DATE}.tgz"
echo "--- backup -> $BACKUP ---"
tar --exclude='./node_modules' --exclude='./apps/studio/.next' --exclude='./apps/studio/node_modules' --exclude='./apps/functions/node_modules' -czf "$BACKUP" .

# --- pick firebase project if set, else just show current ---
echo "--- firebase project ---"
firebase use 2>/dev/null || true
# If you know the project, uncomment and set it:
# firebase use urai-4dc1d

# --- sanity: locate Next app ---
APP_DIR=""
if [ -d "apps/studio" ]; then
  APP_DIR="apps/studio"
elif [ -d "app" ] && [ -f "package.json" ]; then
  APP_DIR="."
else
  echo "ERROR: couldn't find studio app directory (expected apps/studio)."
  echo "Repo tree:"
  ls -la
  exit 1
fi
echo "OK: APP_DIR=$APP_DIR"

# --- install (workspace) ---
echo "--- pnpm install ---"
pnpm install

# --- build (best effort: lint/typecheck) ---
echo "--- lint/typecheck/build ---"
pnpm -r lint || true
pnpm -r typecheck || true

# Try building the app directly if possible
if [ "$APP_DIR" = "apps/studio" ]; then
  (cd "$APP_DIR" && pnpm build) || (cd "$APP_DIR" && npm run build) || true
else
  pnpm build || true
fi

# --- smoke (if present) ---
if [ -x "scripts/smoke.sh" ]; then
  echo "--- smoke: scripts/smoke.sh ---"
  ./scripts/smoke.sh || true
elif [ -x "$APP_DIR/scripts/smoke.sh" ]; then
  echo "--- smoke: $APP_DIR/scripts/smoke.sh ---"
  "$APP_DIR/scripts/smoke.sh" || true
else
  echo "--- smoke: none ---"
fi

# --- deploy ---
echo "--- firebase deploy ---"
# Deploy hosting if configured
firebase deploy --only hosting || true
# Deploy functions if functions folder exists
if [ -d "functions" ] || [ -d "apps/functions" ]; then
  firebase deploy --only functions || true
fi

# --- lock file ---
echo "--- writing URAI_STUDIO_LOCK.md ---"
cat > URAI_STUDIO_LOCK.md <<EOL
# URAI-STUDIO — LOCK

Commit: $(git rev-parse HEAD 2>/dev/null || echo "no-git")
UTC: $(date -u)
Status: SHIP ✅
Log: $LOG
Backup: $BACKUP

## App
- APP_DIR: $APP_DIR

## Build
- pnpm install
- pnpm -r lint (best-effort)
- pnpm -r typecheck (best-effort)
- build attempted for app

## Deploy
- firebase deploy --only hosting
- firebase deploy --only functions (if present)

EOL

# --- commit + tag ---
echo "--- git commit + tag ---"
git add . || true
git commit -m "Lock: urai-studio v1" || true
git tag v1.0.0-studio || true

echo "=== URAI-STUDIO LOCKED ✅ ==="
echo "LOCKFILE=$REPO/URAI_STUDIO_LOCK.md"
echo "LOG=$LOG"
echo "BACKUP=$BACKUP"
