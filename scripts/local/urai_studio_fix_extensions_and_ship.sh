#!/usr/bin/env bash
set -euo pipefail

# URAI-STUDIO: unblock "Unexpected key extensions" + deploy functions + lock/tag
# - tries newest firebase-tools (@next) first
# - if still fails, temporarily strips top-level "extensions" from firebase.json and retries
# - restores firebase.json afterwards no matter what
# - then runs your existing ./urai_studio_ship_lock.sh to lock/tag (tags only if deploy ok)

PROJECT_ID="${URAI_FIREBASE_PROJECT:-urai-studio}"
REPO="${URAI_REPO:-$HOME/urai-studio}"
TAG="${URAI_TAG:-v1.0.0-studio}"

ts="$(date -u +%Y%m%d_%H%M%S)"
LOG="/tmp/urai_studio_fix_extensions_ship_${ts}.log"
exec > >(tee -a "$LOG") 2>&1

die(){ echo "FATAL: $*" >&2; exit 1; }
have(){ command -v "$1" >/dev/null 2>&1; }

echo "=== URAI-STUDIO FIX+SHIP START (UTC $(date -u)) ==="
echo "REPO=$REPO"
echo "PROJECT_ID=$PROJECT_ID"
echo "TAG=$TAG"
echo "LOG=$LOG"

have node || die "node not found"
have npm || die "npm not found"
have git || echo "WARN: git not found (lock/tag may be limited)"
cd "$REPO" || die "cannot cd to $REPO"
[ -f firebase.json ] || die "missing firebase.json in $(pwd)"

# Ensure firebase-tools available globally too (you already did this, but harmless)
if have firebase; then
  echo "--- firebase (global) version ---"
  firebase --version || true
else
  echo "--- installing firebase-tools@latest globally (best effort) ---"
  npm i -g firebase-tools@latest
fi

echo "--- npx firebase-tools@next version ---"
npx -y firebase-tools@next --version

backup_dir=".bak/$ts"
mkdir -p "$backup_dir"
cp -a firebase.json "$backup_dir/firebase.json.orig"
echo "OK: backed up firebase.json -> $backup_dir/firebase.json.orig"

restore_firebase_json() {
  if [ -f "$backup_dir/firebase.json.orig" ]; then
    cp -a "$backup_dir/firebase.json.orig" firebase.json
    echo "OK: restored original firebase.json"
  fi
}
trap restore_firebase_json EXIT

deploy_with_next() {
  echo "--- DEPLOY (npx firebase-tools@next) ---"
  set +e
  OUT="$(npx -y firebase-tools@next deploy --project "$PROJECT_ID" --only functions 2>&1)"
  RC=$?
  set -e
  echo "$OUT"
  return $RC
}

deploy_with_global() {
  echo "--- DEPLOY (global firebase CLI) ---"
  set +e
  OUT="$(firebase deploy --project "$PROJECT_ID" --only functions 2>&1)"
  RC=$?
  set -e
  echo "$OUT"
  return $RC
}

needs_extensions_strip() {
  echo "$1" | grep -qi "Unexpected key extensions"
}

strip_extensions_from_firebase_json() {
  echo "--- patch firebase.json: remove top-level \"extensions\" key (temporary) ---"
  # Use node to safely parse + rewrite JSON
  node - <<'NODE'
const fs = require('fs');
const p = 'firebase.json';
const raw = fs.readFileSync(p, 'utf8');
let j;
try { j = JSON.parse(raw); } catch (e) {
  console.error("FATAL: firebase.json is not valid JSON:", e.message);
  process.exit(2);
}
if (!Object.prototype.hasOwnProperty.call(j, 'extensions')) {
  console.log("INFO: no top-level 'extensions' key present; nothing to strip.");
  process.exit(0);
}
delete j.extensions;
fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
console.log("OK: stripped top-level 'extensions' from firebase.json (temporary).");
NODE
}

echo "--- quick scan: where is 'extensions' referenced? ---"
grep -RIn --exclude-dir=node_modules --exclude-dir=.git '"extensions"\|extensions:' . | head -n 120 || true

# 1) Try deploy with newest CLI (next)
set +e
OUT_NEXT="$(deploy_with_next)"
RC_NEXT=$?
set -e

if [ $RC_NEXT -eq 0 ]; then
  echo "OK: deploy succeeded with firebase-tools@next"
else
  if needs_extensions_strip "$OUT_NEXT"; then
    echo "WARN: still failing due to 'Unexpected key extensions' — applying temporary firebase.json patch"
    strip_extensions_from_firebase_json

    # 2) Retry with next again (after strip)
    set +e
    OUT_NEXT2="$(deploy_with_next)"
    RC_NEXT2=$?
    set -e

    if [ $RC_NEXT2 -ne 0 ]; then
      echo "WARN: deploy still failed after stripping extensions. Trying global CLI as a last attempt."
      set +e
      OUT_G="$(deploy_with_global)"
      RC_G=$?
      set -e
      if [ $RC_G -ne 0 ]; then
        echo
        echo "=== STILL FAILED ==="
        echo "Last error tail:"
        echo "$OUT_G" | tail -n 120
        exit 2
      fi
    fi
  else
    echo
    echo "=== DEPLOY FAILED (not the extensions-parser error) ==="
    echo "Tail:"
    echo "$OUT_NEXT" | tail -n 120
    exit 2
  fi
fi

# If we got here, deploy succeeded (with either next or patched+retry)
echo "--- functions:list ---"
# Prefer next so output matches deploy toolchain
npx -y firebase-tools@next functions:list --project "$PROJECT_ID" || true

# Restore firebase.json (trap will do it, but do it now so lock file reflects normal state)
restore_firebase_json
trap - EXIT

# Run your lock script to record success + tag
[ -x ./urai_studio_ship_lock.sh ] || die "missing ./urai_studio_ship_lock.sh in repo root"
echo "--- running ship+lock ---"
./urai_studio_ship_lock.sh

echo "=== URAI-STUDIO FIX+SHIP END (SUCCESS) ==="
