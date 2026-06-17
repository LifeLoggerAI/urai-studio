#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-http://127.0.0.1:3000}"
EXPECT_READY="${EXPECT_READY:-true}"
EXPECT_PROTECTED_AUTH="${EXPECT_PROTECTED_AUTH:-auto}"
PLACEHOLDERS='TODO|lorem ipsum|coming soon|\[object Object\]'
SECRET_PATTERN='SECRET|PRIVATE_KEY|TOKEN|PASSWORD'

HTML_ROUTES=(
  /
  /systems
  /studio
  /generate
  /assets
  /jobs
  /pricing
  /about
  /motion
  /cinema
  /music
  /visuals
  /spatial
  /demo
  /waitlist
  /contact
  /privacy
  /terms
  /status
)

PUBLIC_API_ROUTES=(
  /api/health
  /api/system/health
  /api/system/manifest
  /api/system/capabilities
  /api/system/integration-contract
  /api/system/urai-contract
  /api/system/openapi
  /healthz
  /sitemap.xml
  /robots.txt
)

PROTECTED_API_ROUTES=(
  /api/studio/jobs
  /api/studio/exports
)

echo "URAI Studio smoke host: ${HOST}"

fail() {
  echo "[FAIL] $*" >&2
  exit 1
}

page_marker_for_route() {
  local route="$1"
  local marker

  case "$route" in
    /) marker="home" ;;
    /systems) marker="system" ;;
    *) marker="$(printf '%s' "$route" | sed 's#^/##')" ;;
  esac

  printf 'data-urai-studio-page="%s"' "$marker"
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

check_json_contains() {
  local path="$1"
  local token="$2"
  local url="${HOST}${path}"
  local body

  body="$(mktemp)"
  curl -L -sS -o "$body" "$url" || {
    rm -f "$body"
    fail "request failed: $url"
  }

  grep -q "$token" "$body" || {
    echo "--- response body for $url ---" >&2
    cat "$body" >&2 || true
    echo >&2
    rm -f "$body"
    fail "$url missing token: $token"
  }

  rm -f "$body"
  echo "[OK] $path contains $token"
}

check_html_route() {
  local route="$1"
  local body
  local code
  local marker
  local url="${HOST}${route}"

  body="$(mktemp)"
  code="$(curl -L -sS -o "$body" -w "%{http_code}" "$url")" || {
    rm -f "$body"
    fail "request failed: $url"
  }

  if [ "$code" != "200" ]; then
    echo "--- response body for $url ---" >&2
    cat "$body" >&2 || true
    echo >&2
    rm -f "$body"
    fail "$url returned $code, expected 200"
  fi

  marker="$(page_marker_for_route "$route")"

  grep -qi '<title' "$body" || fail "$route missing <title>"
  grep -qi 'name="viewport"' "$body" || fail "$route missing viewport meta"
  grep -qi 'name="description"' "$body" || fail "$route missing description meta"
  grep -q "$marker" "$body" || fail "$route missing marker: $marker"

  ! grep -Eiq "$PLACEHOLDERS" "$body" ||
    fail "$route contains placeholder or invalid rendered content"

  rm -f "$body"
  echo "[OK] html $route"
}

check_api_route() {
  local route="$1"
  local body
  local code
  local url="${HOST}${route}"

  body="$(mktemp)"
  code="$(curl -L -sS -o "$body" -w "%{http_code}" "$url")" || {
    rm -f "$body"
    fail "request failed: $url"
  }

  if [ "$code" != "200" ]; then
    if [ "$route" = "/api/system/health" ] && [ "$EXPECT_READY" = "false" ] && [ "$code" = "503" ]; then
      node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
        if (data.service && data.service !== 'urai-studio') process.exit(2);
        if (data.ok !== false) process.exit(3);
        if (data.readiness?.status !== 'degraded') process.exit(4);
      " "$body" || {
        rm -f "$body"
        fail "$route returned invalid degraded health JSON"
      }
      rm -f "$body"
      echo "[OK] api $route -> 503 degraded allowed"
      return
    fi

    echo "--- response body for $url ---" >&2
    cat "$body" >&2 || true
    echo >&2
    rm -f "$body"
    fail "$url returned $code, expected 200"
  fi

  if [[ "$route" == /api/* || "$route" == "/healthz" ]]; then
    node -e "
      const fs = require('fs');
      const route = process.argv[2];
      const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
      if (data.service && data.service !== 'urai-studio') process.exit(2);
      if ((route === '/api/health' || route === '/healthz') && data.ok === false) process.exit(3);
    " "$body" "$route" || {
      rm -f "$body"
      fail "$route returned invalid JSON"
    }
  fi

  case "$route" in
    /api/system/integration-contract|/api/system/urai-contract|/api/system/openapi|/api/system/manifest|/api/system/capabilities)
      # Contract/spec endpoints may document secret-bearing environment key names.
      # They must still return valid JSON above, but key-name documentation is not a leaked value.
      ;;
    *)
      if grep -Eiq "$SECRET_PATTERN" "$body"; then
        rm -f "$body"
        fail "possible secret exposure: $route"
      fi
      ;;
  esac

  rm -f "$body"
  echo "[OK] api $route"
}

check_protected_api_route() {
  local route="$1"
  local body
  local code
  local url="${HOST}${route}"

  body="$(mktemp)"
  code="$(curl -L -sS -o "$body" -w "%{http_code}" "$url")" || {
    rm -f "$body"
    fail "request failed: $url"
  }

  if [ "$EXPECT_PROTECTED_AUTH" = "true" ] && [ "$code" != "401" ]; then
    echo "--- response body for $url ---" >&2
    cat "$body" >&2 || true
    echo >&2
    rm -f "$body"
    fail "$url returned $code, expected unauthenticated 401"
  fi

  if [ "$EXPECT_PROTECTED_AUTH" = "false" ] && [ "$code" != "200" ]; then
    echo "--- response body for $url ---" >&2
    cat "$body" >&2 || true
    echo >&2
    rm -f "$body"
    fail "$url returned $code, expected local fallback 200"
  fi

  if [ "$EXPECT_PROTECTED_AUTH" = "auto" ] && [ "$code" != "200" ] && [ "$code" != "401" ]; then
    echo "--- response body for $url ---" >&2
    cat "$body" >&2 || true
    echo >&2
    rm -f "$body"
    fail "$url returned $code, expected 200 local fallback or 401 protected"
  fi

  if [ "$code" = "401" ]; then
    grep -q 'missing_bearer_token' "$body" || grep -q 'unauthorized' "$body" || {
      echo "--- response body for $url ---" >&2
      cat "$body" >&2 || true
      echo >&2
      rm -f "$body"
      fail "$route returned 401 without expected auth error"
    }
    rm -f "$body"
    echo "[OK] protected api $route -> 401 auth required"
    return
  fi

  case "$route" in
    /api/system/integration-contract|/api/system/urai-contract|/api/system/openapi|/api/system/manifest|/api/system/capabilities)
      # Contract/spec endpoints may document secret-bearing environment key names.
      # They must still return valid JSON above, but key-name documentation is not a leaked value.
      ;;
    *)
      if grep -Eiq "$SECRET_PATTERN" "$body"; then
        rm -f "$body"
        fail "possible secret exposure: $route"
      fi
      ;;
  esac

  rm -f "$body"
  echo "[OK] protected api $route -> $code"
}

for route in "${HTML_ROUTES[@]}"; do
  check_html_route "$route"
done

for route in "${PUBLIC_API_ROUTES[@]}"; do
  check_api_route "$route"
done

for route in "${PROTECTED_API_ROUTES[@]}"; do
  check_protected_api_route "$route"
done

check_json_field /api/system/health service urai-studio
check_json_field /healthz type liveness
check_json_field /api/system/urai-contract service urai-studio
check_json_field /api/system/urai-contract appRoot apps/studio
check_json_field /api/system/urai-contract contract.canonicalStudioAppPath apps/studio
check_json_contains /api/system/urai-contract V1_GENESIS_HOME
check_json_contains /api/system/urai-contract V5_MIRROR_OF_BECOMING
check_json_contains /api/system/integration-contract /api/system/urai-contract
check_json_contains /api/system/integration-contract /api/studio/jobs
check_json_contains /api/system/integration-contract /api/studio/exports

if [ "$EXPECT_PROTECTED_AUTH" = "false" ]; then
  check_json_contains /api/studio/jobs tenantScoped
  check_json_field /api/studio/exports service urai-studio
  check_json_field /api/studio/exports tenantScoped true
fi

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

if [ "$EXPECT_PROTECTED_AUTH" = "true" ]; then
  unauth_job_status="$(
    curl -L -sS \
      -o /tmp/urai-smoke-job \
      -w "%{http_code}" \
      -H 'content-type: application/json' \
      -d '{"prompt":"short"}' \
      "${HOST}/api/studio/jobs"
  )" || fail "unauthenticated studio job request failed"

  [ "$unauth_job_status" = "401" ] ||
    fail "unauthenticated studio job returned $unauth_job_status, expected 401"

  echo "[OK] /api/studio/jobs unauthenticated -> 401"

  unauth_export_status="$(
    curl -L -sS \
      -o /tmp/urai-smoke-export \
      -w "%{http_code}" \
      -H 'content-type: application/json' \
      -d '{"kind":"json"}' \
      "${HOST}/api/studio/exports"
  )" || fail "unauthenticated studio export request failed"

  [ "$unauth_export_status" = "401" ] ||
    fail "unauthenticated studio export returned $unauth_export_status, expected 401"

  echo "[OK] /api/studio/exports unauthenticated -> 401"
else
  invalid_job_status="$(
    curl -L -sS \
      -o /tmp/urai-smoke-job \
      -w "%{http_code}" \
      -H 'content-type: application/json' \
      -d '{"prompt":"short"}' \
      "${HOST}/api/studio/jobs"
  )" || fail "invalid studio job request failed"

  [ "$invalid_job_status" = "400" ] ||
    fail "invalid studio job returned $invalid_job_status, expected 400"

  echo "[OK] /api/studio/jobs invalid prompt -> 400"

  invalid_export_status="$(
    curl -L -sS \
      -o /tmp/urai-smoke-export \
      -w "%{http_code}" \
      -H 'content-type: application/json' \
      -d '{"kind":"json"}' \
      "${HOST}/api/studio/exports"
  )" || fail "invalid studio export request failed"

  [ "$invalid_export_status" = "400" ] ||
    fail "invalid studio export returned $invalid_export_status, expected 400"

  echo "[OK] /api/studio/exports invalid project -> 400"
fi

rm -f /tmp/urai-smoke-waitlist /tmp/urai-smoke-contact /tmp/urai-smoke-job /tmp/urai-smoke-export

echo "[PASS] URAI Studio smoke completed against ${HOST}"
