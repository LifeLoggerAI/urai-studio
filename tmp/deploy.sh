#!/bin/bash
set -e
cd uraistudio-app
pnpm install
pnpm --filter uraistudio-app build
firebase deploy --project urai-staging
