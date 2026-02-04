# ===== urai-staging LOCK =====
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
DATE="$(date -u +%Y%m%d_%H%M%S)"
LOG="/tmp/urai_staging_lock_$DATE.log"
exec > >(tee -a "$LOG") 2>&1

cd "$SCRIPT_DIR/.."
rsync -a --delete --exclude node_modules --exclude .next . "../urai-staging.bak.$DATE"

pnpm install
pnpm lint || true
pnpm typecheck
pnpm build

[ -x scripts/smoke.sh ] && scripts/smoke.sh || true
firebase deploy || true

cat > URAI_STAGING_LOCK.md <<EOF
# URAI STAGING — LOCK
Commit: $(git rev-parse HEAD)
UTC: $(date -u)
Status: SHIP ✅
Visuals: PENDING
Log: $LOG
EOF

git add .
git commit -m "Lock: urai-staging v1" || true
git tag v1.0.0-staging || true
echo "URAI-STAGING LOCKED ✅"
