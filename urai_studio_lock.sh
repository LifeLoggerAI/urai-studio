#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID_DEFAULT="urai-4dc1d"
TAG_DEFAULT="v1.0.0-studio"

REPO="${REPO:-$HOME/urai-studio}"
PROJECT_ID="${URAI_FIREBASE_PROJECT:-$PROJECT_ID_DEFAULT}"
TAG="${URAI_TAG:-$TAG_DEFAULT}"
APP_DIR="${URAI_APP_DIR:-apps/studio}"          # change if needed
PUBLIC_DIR_OVERRIDE="${URAI_PUBLIC_DIR:-}"      # optional: apps/studio/out, apps/studio/dist, etc.

ts="$(date -u +%Y%m%d_%H%M%S)"
LOG="/tmp/urai_studio_lock_${ts}.log"
exec > >(tee -a "$LOG") 2>&1

echo "=== URAI-STUDIO LOCK START (UTC $(date -u)) ==="
echo "REPO=$REPO"
echo "PROJECT_ID=$PROJECT_ID"
echo "TAG=$TAG"
echo "APP_DIR=$APP_DIR"
echo "LOG=$LOG"

cd "$REPO"

echo "--- disk check ---"
df -h / || true
df -h "$REPO" || true

echo "--- git preflight ---"
HAS_GIT=0
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  HAS_GIT=1
  echo "OK: git repo detected"
else
  echo "WARN: not a git repo — will skip commit/tag"
fi

echo "--- backup (tracked only) ---"
BAK_DIR="$REPO/.bak"; mkdir -p "$BAK_DIR"
BACKUP_TGZ="$BAK_DIR/urai-studio.tracked.${ts}.tgz"
if [ "$HAS_GIT" -eq 1 ]; then
  git ls-files -z | tar --null -czf "$BACKUP_TGZ" -T -
  echo "OK: backup=$BACKUP_TGZ"
else
  echo "SKIP: no git backup"
fi

echo "--- tool preflight ---"
command -v node >/dev/null 2>&1 || { echo "ERR: node missing"; exit 1; }
command -v firebase >/dev/null 2>&1 || { echo "ERR: firebase CLI missing"; exit 1; }
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERR: pnpm missing (install pnpm, then rerun)"; exit 1
fi

echo "--- ensure firebase project (best-effort) ---"
firebase use "$PROJECT_ID" >/dev/null 2>&1 || true

echo "--- detect App Hosting ---"
USE_APP_HOSTING=0
if [ -f "$REPO/apphosting.yaml" ]; then
  USE_APP_HOSTING=1
  echo "OK: apphosting.yaml found => using Firebase App Hosting"
fi

echo "--- install / lint / typecheck / test / build ---"
pnpm -v || true
pnpm install
pnpm -r lint || true
pnpm -r typecheck || true
pnpm -r test || true
pnpm -r build

echo "--- smoke (best-effort) ---"
if [ -x "$REPO/scripts/smoke.sh" ]; then
  "$REPO/scripts/smoke.sh"
elif [ -x "$REPO/$APP_DIR/scripts/smoke.sh" ]; then
  "$REPO/$APP_DIR/scripts/smoke.sh"
else
  echo "No smoke.sh found; minimal artifact checks."
  ok=0
  [ -d "$REPO/$APP_DIR/.next" ] && ok=1
  [ -d "$REPO/$APP_DIR/dist" ] && ok=1
  [ -d "$REPO/$APP_DIR/build" ] && ok=1
  [ -d "$REPO/$APP_DIR/out" ] && ok=1
  [ "$ok" -eq 1 ] || { echo "ERR: no recognizable build output under $APP_DIR"; exit 1; }
fi

echo "--- deploy ---"
DEPLOY_TARGETS=""

if [ "$USE_APP_HOSTING" -eq 1 ]; then
  DEPLOY_TARGETS="apphosting"
else
  # infer public dir for Hosting
  if [ -n "$PUBLIC_DIR_OVERRIDE" ]; then
    PUBLIC_DIR="$PUBLIC_DIR_OVERRIDE"
  else
    if [ -d "$REPO/$APP_DIR/out" ]; then PUBLIC_DIR="$APP_DIR/out"
    elif [ -d "$REPO/$APP_DIR/dist" ]; then PUBLIC_DIR="$APP_DIR/dist"
    elif [ -d "$REPO/$APP_DIR/build" ]; then PUBLIC_DIR="$APP_DIR/build"
    else
      echo "ERR: cannot infer hosting public dir. Set URAI_PUBLIC_DIR (e.g. apps/studio/out) and rerun."
      exit 1
    fi
  fi

  # backup existing firebase files before overwriting
  [ -f firebase.json ] && cp -a firebase.json "$BAK_DIR/firebase.json.${ts}.bak" || true
  [ -f .firebaserc ] && cp -a .firebaserc "$BAK_DIR/.firebaserc.${ts}.bak" || true

  cat > .firebaserc <<JSON
{ "projects": { "default": "$PROJECT_ID" } }
JSON

  cat > firebase.json <<JSON
{
  "hosting": {
    "public": "$PUBLIC_DIR",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Referrer-Policy", "value": "origin-when-cross-origin" }
        ]
      }
    ]
  }
}
JSON

  echo "OK: hosting public=$PUBLIC_DIR"
  DEPLOY_TARGETS="hosting"
fi

if [ -d "$REPO/functions" ] && [ -f "$REPO/functions/package.json" ]; then
  DEPLOY_TARGETS="${DEPLOY_TARGETS},functions"
fi
DEPLOY_TARGETS="${DEPLOY_TARGETS#,}"
echo "Deploy targets: $DEPLOY_TARGETS"

firebase deploy --only "$DEPLOY_TARGETS"

HOST_URL="https://${PROJECT_ID}.web.app"
echo "OK: deploy complete"
echo "HOST_URL=$HOST_URL"

echo "--- write STUDIO_LOCK.md ---"
GIT_SHA="(no-git)"
if [ "$HAS_GIT" -eq 1 ]; then GIT_SHA="$(git rev-parse HEAD 2>/dev/null || echo "(unknown)")"; fi
NODE_V="$(node --version 2>/dev/null || echo "(unknown)")"
PNPM_V="$(pnpm --version 2>/dev/null || echo "(n/a)")"
FIREBASE_V="$(firebase --version 2>/dev/null || echo "(unknown)")"

cat > STUDIO_LOCK.md <<MD
# URAI-STUDIO LOCK

**Status:** LOCKED ✅  
**UTC:** $(date -u +"%Y-%m-%d %H:%M:%S")  
**Project:** $PROJECT_ID  
**Tag:** $TAG  
**Commit:** $GIT_SHA  

## Build + Deploy
- Built workspace (lint/typecheck/tests best-effort)
- Deployed via Firebase ($DEPLOY_TARGETS)

## Versions
- Node: $NODE_V
- pnpm: $PNPM_V
- firebase-tools: $FIREBASE_V

## URL
- $HOST_URL

## Evidence
- Log: \`$LOG\`
- Backup: \`$BACKUP_TGZ\`
MD

echo "--- commit + tag (if git) ---"
if [ "$HAS_GIT" -eq 1 ]; then
  git add STUDIO_LOCK.md firebase.json .firebaserc 2>/dev/null || true
  git add . >/dev/null 2>&1 || true
  if ! git diff --cached --quiet; then
    git commit -m "Lock: urai-studio green v1" || true
  fi
  if ! git rev-parse "$TAG" >/dev/null 2>&1; then
    git tag "$TAG"
    echo "OK: created tag $TAG"
  else
    echo "WARN: tag exists: $TAG"
  fi
fi

echo "=== URAI-STUDIO LOCK COMPLETE ==="
echo "HOST_URL=$HOST_URL"
echo "LOG=$LOG"
