#!/bin/bash

# Exit on first error
set -e

# Install dependencies
pnpm install

# Build the Next.js app
pnpm --filter uraistudio-app build

# Deploy to Firebase
firebase deploy

echo ""
echo "🚀 Deployment complete!"
echo ""
echo "✅ urai-studio is now locked and shipped!"
echo ""

