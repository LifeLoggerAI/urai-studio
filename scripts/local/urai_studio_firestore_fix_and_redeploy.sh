#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${URAI_FIREBASE_PROJECT:-urai-studio}"
REPO="${URAI_REPO:-$HOME/urai-studio}"
REGION_DEFAULT="${URAI_FIRESTORE_REGION:-us-central1}"   # change if you want (e.g. us-east1, us-west2)
LOG="/tmp/urai_studio_firestore_fix_$(date -u +%Y%m%d_%H%M%S).log"

exec > >(tee -a "$LOG") 2>&1

die(){ echo "FATAL: $*" >&2; exit 1; }
have(){ command -v "$1" >/dev/null 2>&1; }

echo "=== URAI-STUDIO FIRESTORE FIX + REDEPLOY (UTC $(date -u)) ==="
echo "PROJECT_ID=$PROJECT_ID"
echo "REPO=$REPO"
echo "REGION_DEFAULT=$REGION_DEFAULT"
echo "LOG=$LOG"

have firebase || die "firebase CLI not found"
cd "$REPO" || die "cannot cd to $REPO"
[ -f firebase.json ] || die "missing firebase.json in $(pwd)"

# ---------------------------------------------------------------------------
# 1) Enable Firestore API and create default database (requires gcloud)
# ---------------------------------------------------------------------------
if ! have gcloud; then
  cat >&2 <<MSG
BLOCKED: gcloud is not installed in this environment, so I can't enable the API or create the Firestore DB via CLI.

Do THIS in the browser (fastest):
1) Enable Firestore API:
   https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${PROJECT_ID}

2) Create the Firestore database (if you haven't yet):
   https://console.firebase.google.com/project/${PROJECT_ID}/firestore

Then re-run:
  cd "$REPO" && ./urai_studio_ship_lock.sh

MSG
  exit 2
fi

echo "--- gcloud present; configuring project ---"
gcloud config set project "$PROJECT_ID" >/dev/null

echo "--- enable firestore API ---"
gcloud services enable firestore.googleapis.com

echo "--- check/create Firestore default database ---"
set +e
gcloud firestore databases describe --database="(default)" >/dev/null 2>&1
HAS_DB=$?
set -e

if [ "$HAS_DB" -ne 0 ]; then
  echo "INFO: (default) Firestore database not found; creating…"
  # Try a few common locations if the chosen one is rejected.
  for loc in "$REGION_DEFAULT" us-central1 us-east1 us-west2 nam5 eur3; do
    echo "TRY: create database in location=$loc"
    set +e
    gcloud firestore databases create --database="(default)" --location="$loc" --type=firestore-native >/dev/null 2>&1
    RC=$?
    set -e
    if [ "$RC" -eq 0 ]; then
      echo "OK: created Firestore (default) in $loc"
      break
    else
      echo "WARN: create failed for $loc (continuing)"
    fi
  done

  # Verify creation
  gcloud firestore databases describe --database="(default)" >/dev/null 2>&1 || die "Firestore database still not present after create attempts"
else
  echo "OK: Firestore (default) already exists"
fi

echo "--- wait a moment for API/db propagation ---"
sleep 10

# ---------------------------------------------------------------------------
# 2) Optional: bump firebase-functions (warning said outdated).
#    This is SAFE-ish, but can introduce breaking changes.
#    We do it only if functions/package.json exists.
# ---------------------------------------------------------------------------
if [ -f functions/package.json ]; then
  echo "--- backup functions/package.json ---"
  ts="$(date -u +%Y%m%d_%H%M%S)"
  mkdir -p ".bak/$ts/functions"
  cp -a functions/package.json ".bak/$ts/functions/package.json"

  echo "--- upgrade firebase-functions to latest (functions dir) ---"
  # prefer pnpm if present; fall back to npm
  if have pnpm; then
    (cd functions && pnpm add firebase-functions@latest)
  else
    (cd functions && npm install --save firebase-functions@latest)
  fi

  echo "--- show diff (functions/package.json + lockfile changes) ---"
  git diff -- functions/package.json pnpm-lock.yaml package-lock.json 2>/dev/null || true
else
  echo "INFO: functions/package.json not found; skipping firebase-functions upgrade"
fi

# ---------------------------------------------------------------------------
# 3) Re-run ship+lock
# ---------------------------------------------------------------------------
echo "--- rerun ship+lock script ---"
[ -x ./urai_studio_ship_lock.sh ] || die "missing ./urai_studio_ship_lock.sh (expected in repo root)"
./urai_studio_ship_lock.sh

echo "=== DONE ==="
