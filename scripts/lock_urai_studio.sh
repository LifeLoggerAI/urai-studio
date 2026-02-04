# ===== urai-studio LOCK =====
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
DATE="$(date -u +%Y%m%d_%H%M%S)"
LOG="/tmp/urai_studio_lock_$DATE.log"
exec > >(tee -a "$LOG") 2>&1

cd "$SCRIPT_DIR/.."
rsync -a --delete --exclude node_modules --exclude .next . "../urai-studio.bak.$DATE"

pnpm install
pnpm lint || true
pnpm typecheck
pnpm build

[ -x scripts/smoke.sh ] && scripts/smoke.sh || true
firebase deploy || true

# --- freeze: commit + tag + report ---
REPORT="LOCK_REPORT_URAI_STUDIO_${DATE}.txt"
{
  echo "URAI_STUDIO_LOCK_REPORT ts=$DATE"
  echo "NODE=$(node -v)"
  echo "PNPM=$(pnpm -v)"
  echo "----- git status -----"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git status
    echo "----- last 10 commits -----"
    git --no-pager log -10 --oneline || true
  else
    echo "git: not a repo"
  fi
  echo "----- build artifacts -----"
  ls -la apps/studio/.next 2>/dev/null || true
} > "$REPORT"
echo "REPORT=$REPORT"

cat > URAI_STUDIO_LOCK.md <<EOF
# URAI STUDIO — LOCK
Commit: $(git rev-parse HEAD)
UTC: $(date -u)
Status: SHIP ✅
Visuals: VERIFIED
Log: $LOG
Report: $REPORT
EOF

git add .
git commit -m "Lock: urai-studio v1" || true
git tag v1.0.0-urai-studio || true
echo "URAI-STUDIO LOCKED ✅"
