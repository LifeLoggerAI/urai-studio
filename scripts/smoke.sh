#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-http://127.0.0.1:3000}"
EXPECT_READY="${EXPECT_READY:-true}"

fail() {
  echo "[FAIL] $*" >&2
  exit 1
}

check_status() {
  local path="$1"
  local expected="$2"
  local url="${HOST}${path}"
  local status
  status="$(curl -L -sS -o /tmp/urai-smoke-body -w "%{http_code}" "$url")" || fail "request failed: $url"
  if [ "$status" != "$expected" ]; then
    echo "--- response body for $url ---" >&2
    cat /tmp/urai-smoke-body >&2 || true
    echo >&2
    fail "$url returned $status, expected $expected"
  fi
  echo "[OK] $path -> $status"
}

check_json_field() {
  local path="$1"
  local field="$2"
  local expected="$3"
  local url="${HOST}${path}"
  local value
  value="$(curl -L -sS "$url" | node -e "let body='';process.stdin.on('data',d=>body+=d);process.stdin.on('end',()=>{const j=JSON.parse(body); const parts='${field}'.split('.'); let v=j; for (const p of parts) v=v?.[p]; process.stdout.write(String(v));})")" || fail "json check failed: $url $field"
  if [ "$value" != "$expected" ]; then
    fail "$url field $field was '$value', expected '$expected'"
  fi
  echo "[OK] $path $field=$expected"
}

# Public launch pages.
for path in \
  / \
  /systems \
  /studio \
  /motion \
  /cinema \
  /music \
  /visuals \
  /spatial \
  /demo \
  /waitlist \
  /contact \
  /privacy \
  /status; do
  check_status "$path" 200
done

# System APIs and metadata surfaces.
for path in \
  /api/health \
  /api/system/health \
  /api/system/manifest \
  /api/system/capabilities \
  /api/system/integration-contract \
  /api/system/openapi \
  /healthz \
  /sitemap.xml \
  /robots.txt; do
  check_status "$path" 200
done

check_json_field /api/system/health service urai-studio
check_json_field /healthz type liveness

if [ "$EXPECT_READY" = "true" ]; then
  check_status /readyz 200
  check_json_field /readyz ok true
else
  check_status /readyz 503
fi

# Forms should reject obviously invalid submissions.
invalid_waitlist_status="$(curl -L -sS -o /tmp/urai-smoke-waitlist -w "%{http_code}" -H 'content-type: application/json' -d '{"email":"not-an-email"}' "${HOST}/api/waitlist")" || fail "invalid waitlist request failed"
[ "$invalid_waitlist_status" = "400" ] || fail "invalid waitlist returned $invalid_waitlist_status, expected 400"
echo "[OK] /api/waitlist invalid email -> 400"

invalid_contact_status="$(curl -L -sS -o /tmp/urai-smoke-contact -w "%{http_code}" -H 'content-type: application/json' -d '{"email":"bad","message":"short"}' "${HOST}/api/contact")" || fail "invalid contact request failed"
[ "$invalid_contact_status" = "400" ] || fail "invalid contact returned $invalid_contact_status, expected 400"
echo "[OK] /api/contact invalid input -> 400"

echo "[PASS] URAI Studio smoke completed against ${HOST}"
