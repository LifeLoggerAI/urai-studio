#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${URAI_FIREBASE_PROJECT:-urai-studio}"
REPO="${URAI_REPO:-$HOME/urai-studio}"
FUNC_DIR="${URAI_FUNCTIONS_DIR:-functions}"

ts="$(date -u +%Y%m%d_%H%M%S)"
LOG="/tmp/urai_studio_fix_buildspec_${ts}.log"
exec > >(tee -a "$LOG") 2>&1

die(){ echo "FATAL: $*" >&2; exit 1; }
have(){ command -v "$1" >/dev/null 2>&1; }

echo "=== URAI-STUDIO: FIX build-spec 'extensions' + DEPLOY + LOCK (UTC $(date -u)) ==="
echo "REPO=$REPO"
echo "PROJECT_ID=$PROJECT_ID"
echo "FUNC_DIR=$FUNC_DIR"
echo "LOG=$LOG"

have firebase || die "firebase CLI not found"
cd "$REPO" || die "cannot cd to $REPO"
[ -f firebase.json ] || die "missing firebase.json in $(pwd)"
[ -d "$FUNC_DIR" ] || die "missing $FUNC_DIR directory"
[ -f "$FUNC_DIR/package.json" ] || die "missing $FUNC_DIR/package.json"

# Backups
mkdir -p ".bak/$ts/$FUNC_DIR"
cp -a "$FUNC_DIR/package.json" ".bak/$ts/$FUNC_DIR/package.json"
[ -f pnpm-lock.yaml ] && cp -a pnpm-lock.yaml ".bak/$ts/pnpm-lock.yaml" || true
[ -f package-lock.json ] && cp -a package-lock.json ".bak/$ts/package-lock.json" || true
[ -f "$FUNC_DIR/package-lock.json" ] && cp -a "$FUNC_DIR/package-lock.json" ".bak/$ts/$FUNC_DIR/package-lock.json" || true

echo "--- versions currently installed (best effort) ---"
node - <<'NODE'
const fs=require('fs');
const p='functions/package.json';
const j=JSON.parse(fs.readFileSync(p,'utf8'));
const dep=(j.dependencies||{});
console.log("firebase-functions:", dep["firebase-functions"]||"(missing)");
console.log("firebase-admin:", dep["firebase-admin"]||"(missing)");
NODE

# Choose package manager
PM="npm"
if have pnpm && [ -f pnpm-lock.yaml ]; then PM="pnpm"; fi
echo "OK: package manager = $PM"

install_ver() {
  local ver="$1"
  echo
  echo "=== TRY firebase-functions@$ver ==="
  if [ "$PM" = "pnpm" ]; then
    (cd "$FUNC_DIR" && pnpm add "firebase-functions@$ver")
  else
    (cd "$FUNC_DIR" && npm install --save "firebase-functions@$ver")
  fi
}

deploy_try() {
  echo "--- deploy functions (project=$PROJECT_ID) ---"
  set +e
  OUT="$(firebase deploy --project "$PROJECT_ID" --only functions 2>&1)"
  RC=$?
  set -e
  echo "$OUT"
  if echo "$OUT" | grep -qi "Unexpected key extensions"; then
    echo "RESULT: still hitting 'Unexpected key extensions'"
    return 10
  fi
  return $RC
}

# Version matrix:
# Start near your current major, then step down.
VERSIONS=(
  "5.1.1"
  "5.0.0"
  "4.9.0"
  "4.8.1"
  "4.7.0"
  "4.4.1"
)

OK=0
for v in "${VERSIONS[@]}"; do
  install_ver "$v"
  if deploy_try; then
    OK=1
    echo "OK: deploy succeeded with firebase-functions@$v"
    break
  else
    rc=$?
    if [ "$rc" -eq 10 ]; then
      echo "CONTINUE: parser mismatch remains at $v"
    else
      echo "STOP: deploy failed with a different error (rc=$rc). Fix that error first."
      exit 2
    fi
  fi
done

if [ "$OK" -ne 1 ]; then
  echo
  echo "FAILED: All attempted firebase-functions versions still produced 'extensions' build-spec."
  echo "Next step is a debug capture to identify the exact spec producer."
  echo "Run:"
  echo "  cd \"$REPO\" && firebase deploy --project \"$PROJECT_ID\" --only functions --debug 2>&1 | tee /tmp/urai_studio_deploy_debug.log"
  exit 3
fi

echo "--- functions:list ---"
firebase functions:list --project "$PROJECT_ID" || true

echo "--- run ship+lock (tags only if deploy OK) ---"
[ -x ./urai_studio_ship_lock.sh ] || die "missing ./urai_studio_ship_lock.sh in repo root"
./urai_studio_ship_lock.sh

echo "=== DONE (GREEN path) ==="
