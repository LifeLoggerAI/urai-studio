# URAI Studio Completion Evidence

Timestamp: 2026-06-16T18:00:00-05:00 America/Chicago
Repository: `LifeLoggerAI/urai-studio`
Branch inspected: `main`
Pass type: connector-based audit continuation, not local shell execution

## Scope

This evidence record continues the verified audit state for URAI Studio without restarting from scratch. It records what could be inspected through the connected GitHub repository tools, what was already present in the repo, what was not runnable from this environment, and what remains required before production launch claims.

## Recovery summary

The requested shell recovery block could not be executed in a cloned local repo from this runtime because raw GitHub network access from the shell was unavailable. I therefore used the connected GitHub repository tools for repository-file inspection and safe write operations.

The following shell commands were requested but not honestly runnable here:

```bash
pwd
git rev-parse --show-toplevel || true
git status --short || true
git branch --show-current || true
git log -1 --oneline || true
df -h
node -v || true
pnpm -v || true
corepack --version || true
find . ... > AUDIT_FILE_LIST.txt
```

Because those were not run in a checked-out shell, this document does not claim a local clean working tree, local file inventory, or local disk/runtime proof.

## Commands requested for verification gates

The requested verification gate sequence was:

```bash
corepack enable || true
corepack prepare pnpm@9.7.0 --activate || npm i -g pnpm@9.7.0
pnpm install --no-frozen-lockfile
pnpm done-done:guard
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm studio:smoke
pnpm --dir functions build
```

## Pass/fail table

| Gate | Status in this pass | Evidence / reason |
| --- | --- | --- |
| Repo access | PASS via GitHub connector | Repository files were readable through connected GitHub tools. |
| Local shell recovery | BLOCKED | Raw shell clone/network access to GitHub was unavailable in this runtime. |
| File inventory generation | BLOCKED | Requires checked-out local shell. |
| `pnpm install --no-frozen-lockfile` | NOT RUN | Requires checked-out local shell and package install. |
| `pnpm done-done:guard` | NOT RUN | Requires checked-out local shell. |
| `pnpm lint` | NOT RUN | Requires checked-out local shell. |
| `pnpm typecheck` | NOT RUN | Requires checked-out local shell. |
| `pnpm test` | NOT RUN | Requires checked-out local shell. |
| `pnpm build` | NOT RUN | Requires checked-out local shell. |
| `pnpm studio:smoke` | NOT RUN | Requires checked-out local shell and app server or configured host. |
| `pnpm --dir functions build` | NOT RUN | Requires checked-out local shell. |
| Firebase deploy | NOT RUN | Must not run without Firebase credentials, project selection, and deploy permission. |
| Live production smoke | NOT RUN | Must only run after deployment target and credentials are confirmed. |

## Artifacts generated

- `docs/URAI_STUDIO_COMPLETION_EVIDENCE.md` was created to preserve this pass's audit/evidence state.

## Files inspected in this continuation pass

- `.env.example`
- `package.json`
- `firebase.json`
- `apphosting.yaml`
- `apps/studio/app/api/contact/route.ts`
- `docs/URAI_STUDIO_FULL_AUDIT.md`
- `docs/URAI_STUDIO_COMPLETION_EVIDENCE.md` existence check

## Confirmed repo facts from inspected files

- Root package declares `pnpm@9.7.0` and Node `>=20 <21`.
- Root scripts include build, dev, lint, typecheck, test, studio smoke, done-done guard, evidence guard, audit, and release check.
- Firebase Hosting source is `apps/studio`.
- Firebase Functions source is `functions`.
- App Hosting config exists and uses `nodejs20`.
- `.env.example` includes Firebase public config, Firebase Admin/server config, emulator defaults, ecosystem URLs, and Stripe server keys.
- Contact API validation is explicit and production-safe when Firebase Admin persistence is unavailable: in production it returns `503`, `ok:false`, `persisted:false`, and does not pretend success.
- The full audit doc already states Studio is a hardened Studio app/backend foundation, not production done-done proof.

## What changed

Created this evidence ledger only.

No application code was changed in this pass.

## Previously suspected env gap rechecked

A previous observation suggested `.env.example` was missing:

- `NEXT_PUBLIC_URAI_JOBS_URL`
- `NEXT_PUBLIC_URAI_CONTENT_URL`
- `NEXT_PUBLIC_B2B_PORTAL_URL`

That was rechecked against the actual current `.env.example`, and those keys are now present. No `.env.example` update was required in this continuation pass.

## Safe implementation/audit findings

### Public API production safety

`apps/studio/app/api/contact/route.ts` does not fake contact persistence in production when Firebase Admin is unavailable. It returns a production error state rather than storing nothing and claiming success.

### Deployment config status

Firebase Hosting and Functions config are present. App Hosting config is present. This is deploy configuration presence, not deploy proof.

### Completion status

The repo remains in the status described by `docs/URAI_STUDIO_FULL_AUDIT.md`: hardened Studio shell/backend foundation with integration contracts and scaffolds, not production done-done.

## Blockers

1. Local shell access to the checked-out repo is required to produce a real `AUDIT_FILE_LIST.txt` and run the requested gate sequence.
2. Firebase credentials and permissions are required before any deploy can be performed.
3. Live production URL smoke evidence is required before live-deployable or done-done claims.
4. The audit's existing blocker list still applies: strict legacy job payload validation, tenant/ownership tests, real provider adapters or feature-gated disabled states, real export packages with signed/download authorization, and live cross-repo handoff proof.

## Exact local command block for the next terminal pass

Run from a fresh checkout of `LifeLoggerAI/urai-studio`:

```bash
pwd
git rev-parse --show-toplevel
git status --short
git branch --show-current
git log -1 --oneline
df -h
node -v
pnpm -v || true
corepack --version || true

find . \
  -path './node_modules' -prune -o \
  -path './.next' -prune -o \
  -path './dist' -prune -o \
  -path './build' -prune -o \
  -path './coverage' -prune -o \
  -path './.git' -prune -o \
  -type f -print | sort > AUDIT_FILE_LIST.txt

corepack enable || true
corepack prepare pnpm@9.7.0 --activate || npm i -g pnpm@9.7.0
pnpm install --no-frozen-lockfile
pnpm done-done:guard
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm studio:smoke
pnpm --dir functions build
```

## Deploy rule

Do not deploy until the following are true:

- Firebase CLI is authenticated.
- The intended Firebase project is confirmed.
- Required production env/secrets are configured.
- Local or CI gates pass.
- A deploy command records exact output.
- A live smoke test records exact output against the production URL.

## Final determination for this pass

- Done-done: NO.
- Live-deployable: NOT PROVEN.
- Safe to continue: YES, with a real shell/CI pass and credentials-bound deploy pass.
