#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${URAI_FIREBASE_PROJECT:-urai-studio}"
REPO="${URAI_REPO:-$HOME/urai-studio}"
LOG="/tmp/urai_studio_unblock_buildspec_$(date -u +%Y%m%d_%H%M%S).log"
ts="$(date -u +%Y%m%d_%H%M%S)"

exec > >(tee -a "$LOG") 2>&1

die(){ echo "FATAL: $*" >&2; exit 1; }
have(){ command -v "$1" >/dev/null 2>&1; }

echo "=== URAI-STUDIO UNBLOCK BUILDSPEC + SHIP (UTC $(date -u)) ==="
echo "PROJECT_ID=$PROJECT_ID"
echo "REPO=$REPO"
echo "LOG=$LOG"

have firebase || die "firebase CLI not found"
cd "$REPO" || die "cannot cd to $REPO"
[ -f firebase.json ] || die "missing firebase.json in $(pwd)"

# Backups
mkdir -p ".bak/$ts"
cp -a firebase.json ".bak/$ts/firebase.json" || true

echo "--- firebase version ---"
firebase --version || true

echo "--- locate build spec / extensions key in repo (excluding node_modules/.git) ---"
# Likely culprits: apphosting.yaml, firebase.yaml, build.yaml, cloudbuild.yaml, functions/.firebase/*.yaml, etc.
# We search for YAML key 'extensions:' specifically.
mapfile -t EXT_FILES < <(grep -RIn --exclude-dir=node_modules --exclude-dir=.git --exclude='pnpm-lock.yaml' -E '^[[:space:]]*extensions[[:space:]]*:' . | cut -d: -f1 | sort -u)

if [ "${#EXT_FILES[@]}" -eq 0 ]; then
  echo "INFO: no YAML 'extensions:' key found by grep."
else
  echo "FOUND files with 'extensions:'"
  printf ' - %s\n' "${EXT_FILES[@]}"
fi

echo "--- also check firebase.json for top-level \"extensions\" (JSON) ---"
node - <<'NODE'
const fs=require('fs');
const j=JSON.parse(fs.readFileSync('firebase.json','utf8'));
console.log(Object.prototype.hasOwnProperty.call(j,'extensions') ? "FOUND: firebase.json has top-level \"extensions\"" : "OK: firebase.json has no top-level \"extensions\"");
NODE

# Disable YAML build-spec files containing extensions:
# We rename them to *.DISABLED.<ts> so you can restore later.
DISABLED=0
for f in "${EXT_FILES[@]}"; do
  # only touch real files
  if [ -f "$f" ]; then
    mkdir -p ".bak/$ts/$(dirname "$f")"
    cp -a "$f" ".bak/$ts/$f"
    mv -f "$f" "${f}.DISABLED.${ts}"
    echo "OK: disabled $f -> ${f}.DISABLED.${ts}"
    DISABLED=$((DISABLED+1))
  fi
done

# If firebase.json has top-level extensions, temporarily remove it too
JSON_STRIPPED=0
if node - <<'NODE'
const fs=require('fs');
const j=JSON.parse(fs.readFileSync('firebase.json','utf8'));
process.exit(Object.prototype.hasOwnProperty.call(j,'extensions')?0:1);
NODE
then
  echo "--- temporarily stripping top-level \"extensions\" from firebase.json ---"
  cp -a firebase.json ".bak/$ts/firebase.json.with_extensions"
  node - <<'NODE'
const fs=require('fs');
const p='firebase.json';
const j=JSON.parse(fs.readFileSync(p,'utf8'));
delete j.extensions;
fs.writeFileSync(p, JSON.stringify(j,null,2)+"\n");
NODE
  JSON_STRIPPED=1
fi

echo "--- deploy functions (project=$PROJECT_ID) ---"
set +e
DEPLOY_OUT="$(firebase deploy --project "$PROJECT_ID" --only functions 2>&1)"
DEPLOY_RC=$?
set -e
echo "$DEPLOY_OUT"

if [ $DEPLOY_RC -ne 0 ]; then
  echo
  echo "=== DEPLOY FAILED ==="
  echo "$DEPLOY_OUT" | tail -n 160
  echo
  echo "Backups are in: .bak/$ts"
  echo "Disabled build-spec files count: $DISABLED"
  echo "firebase.json extensions stripped: $JSON_STRIPPED"
  exit 2
fi

echo "--- functions:list ---"
firebase functions:list --project "$PROJECT_ID" || true

# Restore firebase.json if we stripped it (keep YAML disabled; those were breaking deploy)
if [ "$JSON_STRIPPED" -eq 1 ]; then
  echo "--- restoring original firebase.json (with extensions) ---"
  cp -a ".bak/$ts/firebase.json.with_extensions" firebase.json
fi

echo "--- run ship+lock (tags only if deploy ok) ---"
[ -x ./urai_studio_ship_lock.sh ] || die "missing ./urai_studio_ship_lock.sh in repo root"
./urai_studio_ship_lock.sh

echo "=== SUCCESS ==="
echo "NOTE: Any YAML files containing 'extensions:' remain renamed as *.DISABLED.${ts} to keep deploy unblocked."
echo "If you later need them, restore from .bak/$ts/ or rename back."
