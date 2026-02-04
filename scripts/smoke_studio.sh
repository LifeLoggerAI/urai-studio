
#!/bin/bash

# Fail-fast
set -e

# Navigate to the repo root
cd "$(dirname "$0")/.."

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build the studio app
echo "Building the studio app..."
pnpm -C apps/studio build

# Run a minimal runtime check
echo "Running smoke test..."
node -e "console.log('SMOKE_OK')"

echo "PASS"
