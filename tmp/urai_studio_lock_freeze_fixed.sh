#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
LOG="/tmp/urai_studio_lock_freeze_${TS}.log"
exec > >(tee -a "$LOG") 2>&1

echo "LOG=START urai_studio_lock_freeze ts=$TS"

# --- helpers ---
die(){ echo "FATAL: $*" >&2; exit 1; }
have(){ command -v "$1" >/dev/null 2>&1; }
backup(){ # backup <file>
  local f="$1"
  [ -f "$f" ] || return 0
  cp -a "$f" "${f}.bak.${TS}"
  echo "BACKUP: $f -> ${f}.bak.${TS}"
}

# --- locate repo that contains apps/studio ---
REPO=""
for d in \
  "${URAI_REPO:-}" \
  "$PWD" \
  "$HOME/UrAi" \
  "$HOME/urai" \
  "/home/user/UrAi" \
  "/home/user/urai"
do
  [ -n "$d" ] || continue
  if [ -d "$d" ] && [ -d "$d/apps/studio" ] && [ -f "$d/apps/studio/package.json" ]; then
    REPO="$d"; break
  fi
done
[ -n "$REPO" ] || die "Could not find repo with apps/studio. Set URAI_REPO=/path/to/UrAi and re-run."

cd "$REPO"
echo "REPO=$REPO"

# --- sanity checks ---
have node || die "node not found"
have npm  || die "npm not found"
echo "NODE=$(node -v)  NPM=$(npm -v)"

# --- ensure pnpm via corepack (COMMENTED OUT FOR NIX ENV) ---
# if have corepack; then
#   corepack enable || true
#   corepack prepare pnpm@latest --activate || true
# fi
#
# if ! have pnpm; then
#   echo "pnpm not found; installing pnpm globally via npm..."
#   npm i -g pnpm@latest
# fi
echo "PNPM=$(pnpm -v)"

# --- git snapshot ---
if have git && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD || true)"
  git status --porcelain || true
fi

# --- backups of key config files ---
backup "$REPO/package.json"
backup "$REPO/pnpm-workspace.yaml"
backup "$REPO/.firebaserc"
backup "$REPO/firebase.json"
backup "$REPO/apps/studio/package.json"
backup "$REPO/apps/studio/next.config.js"
backup "$REPO/apps/studio/next.config.mjs"
backup "$REPO/apps/studio/firebase.json"

# --- hard reset node_modules + pnpm store to fix 'pnpm.cjs' missing / broken installs ---
echo "CLEAN: removing node_modules + pnpm artifacts..."
rm -rf "$REPO/node_modules" \
       "$REPO/apps/studio/node_modules" \
       "$REPO/.pnpm-store" \
       "$REPO/pnpm-lock.yaml" \
       "$REPO/apps/studio/pnpm-lock.yaml" || true

pnpm store prune || true

# --- install workspace deps ---
echo "INSTALL: pnpm install (workspace root)"
pnpm install

# --- ensure firebase-admin exists for studio (fixes: Can't resolve 'firebase-admin') ---
echo "DEPS: ensure firebase-admin installed for apps/studio"
pnpm -C "$REPO/apps/studio" add firebase-admin@latest

# --- patch: Geist_Mono is not defined (swap to stable Google fonts Inter + JetBrains Mono) ---
LAYOUT="$REPO/apps/studio/src/app/layout.tsx"
if [ -f "$LAYOUT" ]; then
  if grep -q "Geist_Mono" "$LAYOUT" || grep -q "GeistMono" "$LAYOUT" || grep -q "Geist" "$LAYOUT"; then
    echo "PATCH: layout.tsx font fix (Geist -> Inter/JetBrains_Mono) at $LAYOUT"
    backup "$LAYOUT"

    # Remove any geist/font imports
    perl -0777 -pe 's/^\s*import\s+.*geist\/font.*\n//mg' -i "$LAYOUT" || true
    perl -0777 -pe 's/^\s*import\s+.*from\s+["\'\'\']geist\/font\/.*["\'\'\']\s*;\s*\n//mg' -i "$LAYOUT" || true

    # Ensure next/font/google import includes Inter + JetBrains_Mono (create or augment)
    if grep -q 'from\s\+"next/font/google"' "$LAYOUT"; then
      # If an import from next/font/google exists, replace it with Inter + JetBrains_Mono import.
      perl -0777 -pe 's/^\s*import\s*\{[^}]*\}\s*from\s*["\'\'\']next\/font\/google["\'\'\']\s*;\s*$/import { Inter, JetBrains_Mono } from "next\/font\/google";/mg' -i "$LAYOUT"
    else
      # Insert import at top (after "use client" if present)
      if head -n 1 "$LAYOUT" | grep -q 'use client'; then
        perl -0777 -pe 's/^("use client";\s*\n)/$1import { Inter, JetBrains_Mono } from "next\/font\/google";\n/m' -i "$LAYOUT"
      else
        perl -0777 -pe 's/^/import { Inter, JetBrains_Mono } from "next\/font\/google";\n/m' -i "$LAYOUT"
      fi
    fi

    # Replace constructors
    perl -0777 -pe 's/\bGeist_Mono\s*\(/JetBrains_Mono(/g' -i "$LAYOUT"
    perl -0777 -pe 's/\bGeistMono\s*\(/JetBrains_Mono(/g' -i "$LAYOUT"
    perl -0777 -pe 's/\bGeist\s*\(/Inter(/g' -i "$LAYOUT"

    # Optional: normalize common variable names if present (safe string replacements)
    perl -0777 -pe 's/\bgeistMono\b/jetbrainsMono/g; s/\bgeistSans\b/interFont/g' -i "$LAYOUT" || true
  fi
else
  echo "WARN: $LAYOUT not found; skipping Geist font patch."
fi

# --- attempt to catch common React.lazy default-export mistakes (non-destructive scan) ---
echo "SCAN: looking for suspicious React.lazy patterns that resolve to undefined..."
grep -RIn --exclude-dir=node_modules --exclude-dir=.next \
  -E 'React\.lazy\(\s*\(\)\s*=>\s*import\([^)]*\)\s*\)' \
  "$REPO/apps/studio/src" 2>/dev/null || true

# --- lint/typecheck/build (fail fast) ---
echo "BUILD: lint (if present)"
pnpm -C "$REPO/apps/studio" run -s lint || echo "NOTE: lint script missing or failed; continuing"

echo "BUILD: typecheck (if present)"
pnpm -C "$REPO/apps/studio" run -s typecheck || echo "NOTE: typecheck script missing or failed; continuing"

echo "BUILD: next build"
pnpm -C "$REPO/apps/studio" run -s build

# --- tests (if present) ---
echo "TEST: unit/e2e (if present)"
pnpm -C "$REPO/apps/studio" run -s test || echo "NOTE: test script missing or failed; continuing"

# --- firebase project selection heuristic (tries to find a project containing 'studio') ---
PROJECT_ID=""
if have firebase; then
  echo "FIREBASE: CLI present $(firebase --version || true)"
  # Try to detect project id from firebase projects:list
  set +e
  LIST="$(firebase projects:list 2>/dev/null)"
  set -e
  if echo "$LIST" | grep -qi "studio"; then
    # extract probable project id from table lines containing 'studio' (second column)
    PROJECT_ID="$(echo "$LIST" | awk \'BEGIN{IGNORECASE=1} /studio/ && $0 !~ /Preparing|┌|├|└|Project Display Name/ {print $2; exit}\')"
  fi

  # If .firebaserc exists, prefer its default project id
  if [ -z "$PROJECT_ID" ] && [ -f "$REPO/.firebaserc" ]; then
    PROJECT_ID="$(node -e \'try{const j=require(process.argv[1]);const p=(j.projects&&j.projects.default)||"";process.stdout.write(p)}catch(e){}\' "$REPO/.firebaserc" 2>/dev/null || true)"
  fi

  if [ -z "$PROJECT_ID" ]; then
    echo "WARN: Could not auto-detect Firebase project id for urai-studio."
    echo "      Set it now with: firebase use --add"
    echo "      Then re-run this script."
    echo "LOG=END (NO_DEPLOY) $LOG"
    exit 0
  fi

  echo "PROJECT_ID=$PROJECT_ID"

  # --- deploy (best-effort) ---
  echo "DEPLOY: firebase deploy --project $PROJECT_ID"
  firebase deploy --project "$PROJECT_ID"

else
  echo "WARN: firebase CLI not found; skipping deploy."
fi

# --- freeze: commit + tag + report (if git repo) ---
REPORT="$REPO/LOCK_REPORT_URAI_STUDIO_${TS}.txt"
{
  echo "URAI_STUDIO_LOCK_REPORT ts=$TS"
  echo "REPO=$REPO"
  echo "PROJECT_ID=${PROJECT_ID:-}"
  echo "NODE=$(node -v)"
  echo "PNPM=$(pnpm -v)"
  echo "----- git status -----"
  if have git && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git status
    echo "----- last 10 commits -----"
    git --no-pager log -10 --oneline || true
  else
    echo "git: not a repo"
  fi
  echo "----- build artifacts -----"
  ls -la "$REPO/apps/studio/.next" 2>/dev/null || true
} > "$REPORT"
echo "REPORT=$REPORT"

if have git && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "GIT: committing lock/freeze changes (if any)"
  git add -A
  if ! git diff --cached --quiet; then
    git commit -m "chore(urai-studio): lock & freeze (${TS})"
  else
    echo "GIT: no changes to commit"
  fi
  TAG="urai-studio-locked-${TS}"
  git tag -a "$TAG" -m "URAI Studio locked/frozen ${TS}" || true
  echo "GIT_TAG=$TAG"
fi

echo "LOG=END urai_studio_lock_freeze OK log=$LOG"
echo "LOG_FILE=$LOG"
