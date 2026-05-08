#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-http://127.0.0.1:3000}"
HTML_ROUTES=(/ /studio /generate /assets /pricing /about /privacy /terms)
API_ROUTES=(/api/system/health /api/system/manifest /api/system/capabilities /api/system/integration-contract)

echo "URAI Studio smoke host: ${HOST}"

for route in "${HTML_ROUTES[@]}"; do
  body="$(mktemp)"
  code="$(curl -fsS -o "$body" -w '%{http_code}' "${HOST}${route}")"
  test "$code" = "200"
  grep -qi '<title' "$body"
  grep -qi 'name="viewport"' "$body"
  grep -qi 'name="description"' "$body"
  case "$route" in
    /) marker='data-urai-studio-page="home"' ;;
    /studio) marker='URAI Studio' ;;
    /generate) marker='data-urai-studio-page="generate"' ;;
    /assets) marker='Assets' ;;
    /pricing) marker='data-urai-studio-page="pricing"' ;;
    /about) marker='data-urai-studio-page="about"' ;;
    /privacy) marker='URAI Studio' ;;
    /terms) marker='data-urai-studio-page="terms"' ;;
  esac
  grep -q "$marker" "$body"
  ! grep -Eiq 'TODO|lorem ipsum|coming soon|undefined|null|\[object Object\]' "$body"
  rm -f "$body"
  echo "PASS html ${route}"
done

for route in "${API_ROUTES[@]}"; do
  body="$(mktemp)"
  code="$(curl -fsS -o "$body" -w '%{http_code}' "${HOST}${route}")"
  test "$code" = "200"
  node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (j.service !== 'urai-studio' && j.ok !== true) process.exit(1);" "$body"
  rm -f "$body"
  echo "PASS api ${route}"
done

echo "URAI Studio smoke passed"
