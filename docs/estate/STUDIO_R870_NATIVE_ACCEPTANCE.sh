#!/usr/bin/env bash
# One UrAi Genesis Studio R870: local, non-production, exact-SHA source acceptance.
# Does NOT deploy, activate cloud emulators, enable private media or grant release GO.
set -euo pipefail
export LC_ALL=C
EXPECTED_SHA=638e5cbebe98d8af15561a35f142baca14c94d25
EXPECTED_REPO=LifeLoggerAI/urai-studio
EXPECTED_NODE_MAJOR=20
EXPECTED_PNPM=9.7.0

fail() { printf 'R870 PRECHECK FAIL: %s\n' "$*" >&2; exit 77; }
need() { command -v "$1" >/dev/null 2>&1 || fail "missing required local binary: $1"; }
need git
need node
need pnpm
need sha256sum

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || fail 'not in a Git checkout'
cd "$ROOT"
ORIGIN=$(git remote get-url origin 2>/dev/null) || fail 'missing Git remote origin'
case "$ORIGIN" in
  *github.com:LifeLoggerAI/urai-studio|*github.com:LifeLoggerAI/urai-studio.git|*github.com/LifeLoggerAI/urai-studio|*github.com/LifeLoggerAI/urai-studio.git) ;;
  *) fail "unexpected origin; expected $EXPECTED_REPO" ;;
esac
HEAD=$(git rev-parse HEAD) || fail 'cannot read commit'
[ "$HEAD" = "$EXPECTED_SHA" ] || fail "wrong commit: $HEAD (expected $EXPECTED_SHA)"
[ -z "$(git status --porcelain)" ] || fail 'working tree is dirty; exact-source verification requires clean checkout'
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]') || fail 'Node version check failed'
[ "$NODE_MAJOR" = "$EXPECTED_NODE_MAJOR" ] || fail "Node $EXPECTED_NODE_MAJOR required; got $(node --version)"
PNPM_VERSION=$(pnpm --version) || fail 'pnpm version check failed'
[ "$PNPM_VERSION" = "$EXPECTED_PNPM" ] || fail "pnpm $EXPECTED_PNPM required; got $PNPM_VERSION"
[ -f pnpm-lock.yaml ] && [ -f apps/studio/package.json ] && [ -f functions/package.json ] || fail 'Studio workspace/lockfile missing'

# Never accept cloud credentials while evaluating the private-media release gate.
for name in GOOGLE_APPLICATION_CREDENTIALS GOOGLE_CLOUD_PROJECT GCLOUD_PROJECT FIREBASE_PROJECT_ID FIREBASE_PRIVATE_KEY FIREBASE_CLIENT_EMAIL; do
  if [ -n "${!name:-}" ]; then fail "$name is set; use a credential-free local test shell"; fi
done

STAMP=$(date -u '+%Y%m%dT%H%M%SZ')
OUT="${STUDIO_R870_EVIDENCE_DIR:-$ROOT/_audit/studio-r870-$STAMP}"
mkdir -p "$OUT"
(printf 'commit=%s\norigin=%s\nnode=%s\npnpm=%s\n' "$HEAD" "$ORIGIN" "$(node --version)" "$PNPM_VERSION";
 sha256sum pnpm-lock.yaml package.json apps/studio/package.json functions/package.json) > "$OUT/source-manifest.txt"

run_phase() {
  local label="$1"; shift
  local log="$OUT/$label.log"
  local rc=0
  printf 'R870 phase %s\n' "$label"
  "$@" > "$log" 2>&1 || rc=$?
  printf '%s %s %s\n' "$label" "$rc" "$(sha256sum "$log" | cut -d' ' -f1)" >> "$OUT/phase-status.sha256.txt"
  [ "$rc" -eq 0 ] || {
    printf 'R870 HOLD: %s failed, exit %s. Log: %s\n' "$label" "$rc" "$log" >&2
    exit "$rc"
  }
}
run_phase frozen-install pnpm install --frozen-lockfile
run_phase studio-test pnpm --filter studio test
run_phase studio-typecheck pnpm --filter studio typecheck
run_phase studio-lint pnpm --filter studio lint
run_phase studio-build pnpm --filter studio build
run_phase functions-build pnpm --dir functions build

cat > "$OUT/RELEASE_HOLD.txt" <<'HOLD'
Studio R870 local source acceptance completed, not production authorization.
HOLD: real Auth+Firestore+Storage+Functions emulator concurrency/revocation
HOLD: independently signed positive Privacy C6 consent
HOLD: privileged Jobs Storage post-revoke late-write fence
HOLD: protected source-to-MP4/SRT-to-owner Replay-to-deletion/device E2E
No cloud deployment or private media processing was part of this runner.
HOLD
printf 'R870 local stages PASS; production HOLD. Evidence: %s\n' "$OUT"
