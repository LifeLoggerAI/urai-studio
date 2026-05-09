# CI Trigger

This file exists to trigger the URAI Studio GitHub Actions audit workflow after the latest repo hardening pass.

Latest requested verification chain:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions install --no-frozen-lockfile
pnpm --dir functions build
pnpm studio:smoke
```

Do not use this file as proof of success. Check the GitHub Actions run result before creating `LOCK.md` or deploying.
