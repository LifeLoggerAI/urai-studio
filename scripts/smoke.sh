#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-http://127.0.0.1:3000}"
HTML_ROUTES=(/ /studio /generate /assets /jobs /pricing /about /contact /privacy /terms /status /system)
API_ROUTES=(/api/system/health /api/system/manifest /api/system/capabilities /api/system/integration-contract /api/system/openapi)
PLACEHOLDERS='TODO|lorem ipsum|coming soon|undefined|null|\[object Object\]'

echo "URAI Studio smoke test host: ${HOST}"

for route in "${HTML_ROUTES[@]}"; do
  url="${HOST}${route}"
  body="$(curl -fsSL "$url")"
  marker="data-urai-studio-page=\"$(printf '%s' "$route" | sed 's#^/##; s#^$#home#')\""
  echo "$body" | grep -qi '<title' || { echo "Missing title: $route"; exit 1; }
  echo "$body" | grep -qi 'name="viewport"' || { echo "Missing viewport: $route"; exit 1; }
  echo "$body" | grep -qi 'name="description"' || { echo "Missing description: $route"; exit 1; }
  echo "$body" | grep -q "$marker" || { echo "Missing page marker $marker: $route"; exit 1; }
  if echo "$body" | grep -Eiq "$PLACEHOLDERS"; then
    echo "Placeholder text found: $route"
    exit 1
  fi
  echo "OK HTML $route"
done

for route in "${API_ROUTES[@]}"; do
  url="${HOST}${route}"
  body="$(curl -fsSL "$url")"
  node -e "const data = JSON.parse(process.argv[1]); if (data.service && data.service !== 'urai-studio') process.exit(2); if (data.ok === false) process.exit(3);" "$body"
  if echo "$body" | grep -Eiq 'SECRET|PRIVATE_KEY|TOKEN|PASSWORD'; then
    echo "Possible secret exposure: $route"
    exit 1
  fi
  echo "OK API $route"
done

echo "URAI Studio smoke passed"
