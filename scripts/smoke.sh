#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-http://127.0.0.1:3000}"
EXPECT_READY="${EXPECT_READY:-true}"

HTML_ROUTES=(
  /
  /systems
  /studio
  /motion
  /cinema
  /music
  /visuals
  /spatial
  /demo
  /waitlist
  /contact
  /pricing
  /about
  /privacy
  /terms
  /status
)

API_ROUTES=(
  /api/health
  /api/system/health
  /api/system/manifest
  /api/system/capabilities
  /api/system/integration-contract
  /api/system/openapi
  /healthz
  /sitemap.xml
  /robots.txt
)

echo "URAI Studio smoke host: ${HOST}"

fail() {
  echo "[FAIL] $*" >&2
  exit 1
}

check_status() {
  local path="$1"
  local expected="$2"
  local body
  local status
  local url="${HOST}${path}"

  body="$(mktemp)"
  status="$(curl -L -sS -o "$body" -w "%{http_code}" "$url")" || {
    rm -f "$body"
    fail "request failed: $url"
  }

  if [ "$status" != "$expected" ]; then
    echo "--- response body for $url ---" >&2
    cat "$body" >&2 || true
    echo >&2
    rm -f "$body"
    fail "$url returned $status, expected $expected"
  fi

  rm -f "$body"
  echo "[OK] $path -> $status"
}

check_json_field() {
  local path="$1"
  local field="$2"
  local expected="$3"
  local url="${HOST}${path}"
  local value

  value="$(
    curl -L -sS "$url" |
      node -e "
        let body = '';
        process.stdin.on('data', d => body += d);
        process.stdin.on('end', () => {
          const j = JSON.parse(body);
          const parts = '${field}'.split('.');
          let v = j;
          for (const p of parts) v = v?.[p];
          process.stdout.write(String(v));
        });
      "
  )" || fail "json check failed: $url $field"

  if [ "$value" != "$expected" ]; then
    fail "$url field $field was '$value', expected '$expected'"
  fi

  echo "[OK] $path $field=$expected"
}

check_html_route() {
  local route="$1"
  local body
  local code
  local marker=""

  body="$(mktemp)"
  code="$(curl -L -sS -o "$body" -w "%{http_code}" "${HOST}${route}")" || {
    rm -f "$body"
    fail "request failed: ${HOST}${route}"
  }

  if [ "$code" != "200" ]; then
    echo "--- response body for ${HOST}${route} ---" >&2
    cat "$body" >&2 || true
    echo >&2
    rm -f "$body"
    fail "${HOST}${route} returned $code, expected 200"
  fi

  grep -qi '<title' "$body" || fail "$route missing <title>"
  grep -qi 'name="viewport"' "$body" || fail "$route missing viewport meta"
  grep -qi 'name="description"' "$body" || fail "$route missing description meta"

  case "$route" in
    /) marker='data-urai-studio-page="home"' ;;
    /systems) marker='data-urai-studio-page="systems"' ;;
    /studio) marker='data-urai-studio-page="studio"' ;;
    /motion) marker='data-urai-studio-page="motion"' ;;
    /cinema) marker='data-urai-studio-page="cinema"' ;;
    /music) marker='data-urai-studio-page="music"' ;;
    /visuals) marker='data-urai-studio-page="visuals"' ;;
    /spatial) marker='data-urai-studio-page="spatial"' ;;
    /demo) marker='data-urai-studio-page="demo"' ;;
    /waitlist) marker='data-urai-studio-page="waitlist"' ;;
    /contact) marker='data-urai-studio-page="contact"' ;;
    /pricing) marker='data-urai-studio-page="pricing"' ;;
    /about) marker='data-urai-studio-page="about"' ;;
    /privacy) marker='data-urai-studio-page="privacy"' ;;
    /terms) marker='data-urai-studio-page="terms"' ;;
    /status) marker='data-urai-studio-page="status"' ;;
  esac

  if [ -n "$marker" ]; then
    grep -q "$marker" "$body" || fail "$route missing marker: $marker"
  fi

  ! grep -Eiq 'TODO|lorem ipsum|coming soon|undefined|null|\[object Object\]' "$body" ||
    fail "$route contains placeholder or invalid rendered content"

  rm -f "$body"
  echo "[OK] html $route"
}

for route in "${HTML_ROUTES[@]}"; do
  check_html_route "$route"
done

for route in "${API_ROUTES[@]}"; do
  check_status "$route" 200
done

check_json_field /api/system/health service urai-studio
check_json_field /healthz type liveness

if [ "$EXPECT_READY" = "true" ]; then
  check_status /readyz 200
  check_json_field /readyz ok true
else
  check_status /readyz 503
fi

invalid_waitlist_status="$(
  curl -L -sS \
    -o /tmp/urai-smoke-waitlist \
    -w "%{http_code}" \
    -H 'content-type: application/json' \
    -d '{"email":"not-an-email"}' \
    "${HOST}/api/waitlist"
)" || fail "invalid waitlist request failed"

[ "$invalid_waitlist_status" = "400" ] ||
  fail "invalid waitlist returned $invalid_waitlist_status, expected 400"

echo "[OK] /api/waitlist invalid email -> 400"

invalid_contact_status="$(
  curl -L -sS \
    -o /tmp/urai-smoke-contact \
    -w "%{http_code}" \
    -H 'content-type: application/json' \
    -d '{"email":"bad","message":"short"}' \
    "${HOST}/api/contact"
)" || fail "invalid contact request failed"

[ "$invalid_contact_status" = "400" ] ||
  fail "invalid contact returned $invalid_contact_status, expected 400"

echo "[OK] /api/contact invalid input -> 400"

rm -f /tmp/urai-smoke-waitlist /tmp/urai-smoke-contact

echo "[PASS] URAI Studio smoke completed against ${HOST}"