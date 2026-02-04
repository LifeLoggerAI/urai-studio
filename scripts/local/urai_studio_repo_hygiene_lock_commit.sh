#!/usr/bin/env bash
set -euo pipefail

ts="$(date -u +%Y%m%d_%H%M%S)"
echo "=== URAI-STUDIO REPO HYGIENE (UTC $(date -u)) ==="

# Ensure .gitignore contains backups + local scripts (safe)
touch .gitignore
for line in ".bak/" "firebase.json.bak.*" "/tmp/" "*.log"; do
  grep -qxF "$line" .gitignore || echo "$line" >> .gitignore
done

# Keep the useful scripts, but don't accidentally commit every scratch script.
mkdir -p scripts/local
for f in urai_studio_*\.sh; do
  [ -f "$f" ] || continue
  mv -f "$f" "scripts/local/$f"
done

git add .gitignore scripts/local || true

# Commit *only* repo hygiene artifacts (not .bak)
if ! git diff --cached --quiet; then
  git commit -m "Chore: urai-studio repo hygiene (ignore bak, stash local scripts)"
else
  echo "INFO: nothing to commit for hygiene"
fi

echo "--- status ---"
git status --porcelain=v1 || true
echo "=== DONE ==="
