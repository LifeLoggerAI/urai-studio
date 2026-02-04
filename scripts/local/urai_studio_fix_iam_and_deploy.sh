#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${URAI_FIREBASE_PROJECT:-urai-studio}"
REPO="${URAI_REPO:-$HOME/urai-studio}"
LOG="/tmp/urai_studio_fix_iam_$(date -u +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

die(){ echo "FATAL: $*" >&2; exit 1; }
have(){ command -v "$1" >/dev/null 2>&1; }

echo "=== URAI-STUDIO: FIX IAM (Gen2) + DEPLOY (UTC $(date -u)) ==="
echo "PROJECT_ID=$PROJECT_ID"
echo "REPO=$REPO"
echo "LOG=$LOG"

have firebase || die "firebase CLI not found"
have gcloud || die "gcloud not found (install Google Cloud SDK or run these bindings in Cloud Console as project owner)"

cd "$REPO" || die "cannot cd to $REPO"
[ -f firebase.json ] || die "missing firebase.json in $(pwd)"

echo "--- firebase version ---"
firebase --version || true

echo "--- gcloud auth/accounts ---"
gcloud auth list || true

echo "--- set gcloud project ---"
gcloud config set project "$PROJECT_ID" >/dev/null

echo "--- get project number ---"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
[ -n "$PROJECT_NUMBER" ] || die "could not resolve project number"
echo "OK: PROJECT_NUMBER=$PROJECT_NUMBER"

PUBSUB_SA="service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "--- applying required IAM bindings (idempotent) ---"
echo "1) roles/iam.serviceAccountTokenCreator -> $PUBSUB_SA"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PUBSUB_SA}" \
  --role="roles/iam.serviceAccountTokenCreator" >/dev/null

echo "2) roles/run.invoker -> $COMPUTE_SA"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/run.invoker" >/dev/null

echo "3) roles/eventarc.eventReceiver -> $COMPUTE_SA"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/eventarc.eventReceiver" >/dev/null

echo "OK: IAM bindings applied"

echo "--- retry deploy functions ---"
firebase deploy --project "$PROJECT_ID" --only functions

echo "--- functions:list ---"
firebase functions:list --project "$PROJECT_ID" || true

echo "--- ship+lock ---"
[ -x ./urai_studio_ship_lock.sh ] || die "missing ./urai_studio_ship_lock.sh in repo root"
./urai_studio_ship_lock.sh

echo "=== DONE (DEPLOY OK) ==="
