# URAI Studio Runtime Gate Evidence — 2026-06-25

## Result

Spatial live smoke is green on both public URLs. Studio release verification did not run yet because the shell runtime did not match Studio's required engine.

## Spatial proof received

`pnpm smoke:live` passed for:

- `https://urai.app`
- `https://urai-4dc1d.web.app`

The expanded route chain returned HTTP 200 and passed smoke for root, Home, Ground, Ascent, Life Map, Focus, Replay, Unwind, Mirror, Passport, Privacy Controls, Location Map, and Status.

## Studio blocker

Studio pulled latest `main` through `c0fd8d8cec9d329125cc98eaa91c942fdc438304`, including the system registry completion patch.

`pnpm install --frozen-lockfile` stopped before release verification because the shell was using Node 22 and pnpm 10 while Studio requires Node 20 and pnpm 9.7.0.

```text
Unsupported engine for /home/user/urai-studio: wanted: {"node":">=20 <21","pnpm":"9.7.0"} (current: {"node":"v22.22.3","pnpm":"10.0.0"})
Failed to switch pnpm to v9.7.0
```

## Repo-side fix

Added `scripts/cloudshell-node20-pnpm9-release-check.sh` to enter the expected runtime through nvm or nix-shell where available, activate pnpm 9.7.0, install, and run `pnpm release:check`.

## Next command

```bash
cd ~/urai-studio
git pull origin main
bash scripts/cloudshell-node20-pnpm9-release-check.sh
```

## Status

This is a runtime setup blocker, not a proven Studio source failure.
