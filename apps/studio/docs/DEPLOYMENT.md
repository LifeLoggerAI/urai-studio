# Deployment
firebase use urai-studio
firebase target:apply hosting urai-studio urai-studio --project urai-studio
pnpm --filter studio build
firebase deploy --only hosting:urai-studio --project urai-studio
