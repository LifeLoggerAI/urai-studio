#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# URAI-STUDIO — SHIP + DEPLOY + LOCK (disk-safe, idempotent-ish)
# - backs up key files
# - validates firebase project directory
# - installs + builds (pnpm)
# - attempts functions deploy
# - writes URAI_STUDIO_LOCK.md
# - tags ONLY if deploy succeeds
#
# NOTE: If Firebase says Blaze is required, this script will stop with a clear
#       BLOCKED status + upgrade URL. (You must upgrade in console.)
###############################################################################

# ---- knobs (override via env) ----
PROJECT_ID="${URAI_FIREBASE_PROJECT:-urai-studio}"
TAG="${URAI_TAG:-v1.0.0-studio}"
REPO="${URAI_REPO:-$HOME/urai-studio}"

ts="$(date -u +%Y%m%d_%H%M%S)"
LOG="/tmp/urai_studio_ship_lock_${ts}.log"
exec > >(tee -a "$LOG") 2>&1

die(){ echo "FATAL: $*" >&2; exit 1; }
have(){ command -v "$1" >/dev/null 2>&1; }

echo "=== URAI-STUDIO SHIP+LOCK START (UTC $(date -u)) ==="
echo "REPO=$REPO"
echo "PROJECT_ID=$PROJECT_ID"
echo "TAG=$TAG"
echo "LOG=$LOG"

have git || die "git not found"
have node || die "node not found"
have pnpm || die "pnpm not found"
have firebase || die "firebase CLI not found"

cd "$REPO" || die "could not cd to $REPO"

# ---- sanity: must be firebase project dir ----
[ -f firebase.json ] || die "Not a Firebase project directory here (missing firebase.json). You are in: $(pwd)"
[ -d .git ] || echo "WARN: .git not found (ok if you copied files, but tags/commits won't work)"

# ---- quick repo + firebase context ----
echo "--- git status ---"
git status --porcelain=v1 || true
echo "--- firebase context ---"
firebase --version || true

# ---- back up key files (cheap + safe) ----
mkdir -p .bak/"$ts"
for f in firebase.json .firebaserc firestore.rules storage.rules functions/package.json functions/tsconfig.json package.json pnpm-lock.yaml; do
  if [ -f "$f" ]; then
    mkdir -p ".bak/$ts/$(dirname "$f")"
    cp -a "$f" ".bak/$ts/$f"
    echo "OK: backed up $f -> .bak/$ts/$f"
  fi
done

# ---- ensure firebase project selection is explicit ----
# Prefer --project on all commands; also try to set an alias if .firebaserc exists.
if [ -f .firebaserc ]; then
  echo "--- .firebaserc present; ensuring alias 'default' -> $PROJECT_ID (best effort) ---"
  # This won't hurt if already set; ignore errors.
  firebase use --add "$PROJECT_ID" >/dev/null 2>&1 || true
fi

# ---- install + build (workspace aware) ----
echo "--- pnpm install ---"
pnpm install

echo "--- build (best effort: root build; then functions build if present) ---"
if pnpm -w -s run build >/dev/null 2>&1; then
  pnpm -w run build
else
  echo "WARN: no root build script; continuing"
fi

if [ -d functions ]; then
  echo "--- functions install/build ---"
  ( cd functions && pnpm install )
  # try common scripts
  if ( cd functions && pnpm -s run build >/dev/null 2>&1 ); then
    ( cd functions && pnpm run build )
  elif ( cd functions && pnpm -s run lint >/dev/null 2>&1 ); then
    echo "INFO: no functions build script; running lint instead"
    ( cd functions && pnpm run lint ) || true
  else
    echo "INFO: no functions build/lint scripts detected; skipping"
  fi
else
  echo "INFO: no functions/ directory; functions deploy may still exist via config, but skipping local functions build"
fi

# ---- attempt functions deploy ----
echo "--- firebase deploy --only functions (project=$PROJECT_ID) ---"
set +e
DEPLOY_OUT="$(firebase deploy --project "$PROJECT_ID" --only functions 2>&1)"
DEPLOY_RC=$?
set -e
echo "$DEPLOY_OUT"

DEPLOY_STATUS="UNKNOWN"
BLOCK_REASON=""
UPGRADE_URL="https://console.firebase.google.com/project/${PROJECT_ID}/usage/details"

if [ $DEPLOY_RC -eq 0 ]; then
  DEPLOY_STATUS="OK"
else
  if echo "$DEPLOY_OUT" | grep -qi "must be on the Blaze"; then
    DEPLOY_STATUS="BLOCKED_BLAZE_REQUIRED"
    BLOCK_REASON="Cloud Functions deploy requires Blaze; required APIs (cloudbuild/cloudfunctions/artifactregistry) can't be enabled on Spark."
  else
    DEPLOY_STATUS="FAILED"
    BLOCK_REASON="firebase deploy failed (see log)"
  fi
fi

# ---- list functions (best effort) ----
echo "--- firebase functions:list (project=$PROJECT_ID) ---"
set +e
FUNCS_OUT="$(firebase functions:list --project "$PROJECT_ID" 2>&1)"
FUNCS_RC=$?
set -e
echo "$FUNCS_OUT" || true

# ---- write LOCK file (always) ----
LOCK_FILE="URAI_STUDIO_LOCK.md"
GIT_SHA="$(git rev-parse HEAD 2>/dev/null || echo "unknown")"
GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"

cat > "$LOCK_FILE" <<MD
# URAI_STUDIO_LOCK

- **UTC Locked At:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **Repo:** $(pwd)
- **Git Branch:** ${GIT_BRANCH}
- **Git Commit:** ${GIT_SHA}
- **Firebase Project:** ${PROJECT_ID}
- **Tag Target:** ${TAG}
- **Functions Deploy Status:** ${DEPLOY_STATUS}
- **Log:** ${LOG}

## Deploy Notes
MD

if [ "$DEPLOY_STATUS" = "OK" ]; then
  cat >> "$LOCK_FILE" <<MD
✅ Functions deploy completed successfully.

### functions:list
\`\`\`
${FUNCS_OUT}
\`\`\`
MD
elif [ "$DEPLOY_STATUS" = "BLOCKED_BLAZE_REQUIRED" ]; then
  cat >> "$LOCK_FILE" <<MD
⚠️ **BLOCKED: Blaze upgrade required**

Reason:
- ${BLOCK_REASON}

Upgrade here (Billing → Blaze):
- ${UPGRADE_URL}

After upgrading, re-run:
\`\`\`bash
cd "$REPO" && ./urai_studio_ship_lock.sh
\`\`\`
MD
else
  cat >> "$LOCK_FILE" <<MD
❌ Deploy failed.

Reason:
- ${BLOCK_REASON}

### deploy output (tail)
\`\`\`
$(echo "$DEPLOY_OUT" | tail -n 120)
\`\`\`

### functions:list
\`\`\`
${FUNCS_OUT}
\`\`\`
MD
fi

echo "OK: wrote $LOCK_FILE"

# ---- commit LOCK file (best effort) ----
if [ -d .git ]; then
  echo "--- git add/commit (LOCK file + any changes) ---"
  git add "$LOCK_FILE" || true
  # only commit if there is something staged
  if ! git diff --cached --quiet; then
    git commit -m "Lock: urai-studio (${DEPLOY_STATUS})" || true
  else
    echo "INFO: nothing staged to commit"
  fi
fi

# ---- tag ONLY if deploy OK ----
if [ "$DEPLOY_STATUS" = "OK" ] && [ -d .git ]; then
  echo "--- tagging $TAG ---"
  if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "INFO: tag already exists: $TAG"
  else
    git tag "$TAG"
    echo "OK: created tag $TAG"
  fi
else
  echo "INFO: not tagging because deploy status = $DEPLOY_STATUS"
fi

echo "=== URAI-STUDIO SHIP+LOCK END (status=$DEPLOY_STATUS) ==="

# Hard fail if blocked/failed so CI / you notice.
if [ "$DEPLOY_STATUS" != "OK" ]; then
  echo
  echo "NEXT ACTION:"
  if [ "$DEPLOY_STATUS" = "BLOCKED_BLAZE_REQUIRED" ]; then
    echo "1) Open: $UPGRADE_URL"
    echo "2) Upgrade to Blaze"
    echo "3) Re-run: cd \"$REPO\" && ./urai_studio_ship_lock.sh"
  else
    echo "Fix the deploy error shown above, then re-run: cd \"$REPO\" && ./urai_studio_ship_lock.sh"
  fi
  exit 2
fi
