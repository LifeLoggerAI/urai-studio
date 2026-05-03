# Testing

Run full verification:

```bash
pnpm install --frozen-lockfile
pnpm --filter studio lint
pnpm --filter studio typecheck
pnpm --filter studio test
pnpm --filter studio build
pnpm --filter studio smoke
```

CI runs the same commands in `.github/workflows/studio-ci.yml`.
