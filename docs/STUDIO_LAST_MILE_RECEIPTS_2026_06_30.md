# Studio last mile receipts

Date: 2026-06-30

Latest hardening commit checked: 8408675e0f9e8440720b8599787376aa7d73983d

## Repo-side changes already pushed

- Expanded public route smoke coverage from 36 to 43 routes.
- Added route file existence coverage for Generate and Video Factory routes.
- Fixed runtime store contract test quote matching.
- Added API, provider, runtime, export, and action-panel regression coverage in earlier continuation commits.

## Verification attempted from this assistant runtime

### Local checkout

Command:

```bash
rm -rf /tmp/urai-studio && git clone --depth 1 https://github.com/LifeLoggerAI/urai-studio.git /tmp/urai-studio
```

Result:

```text
fatal: unable to access 'https://github.com/LifeLoggerAI/urai-studio.git/': Could not resolve host: github.com
```

### Live URL smoke

Command shape:

```bash
curl -I -L --max-time 20 https://www.uraistudio.com
curl -I -L --max-time 20 https://www.uraistudio.com/healthz
curl -I -L --max-time 20 https://www.uraistudio.com/readyz
curl -I -L --max-time 20 https://www.uraistudio.com/api/health
curl -I -L --max-time 20 https://www.uraistudio.com/status
```

Result:

```text
curl: (6) Could not resolve host: www.uraistudio.com
```

## Current status

PARTIAL WITH BLOCKERS.

The repo has stronger route and safety coverage, but it must not be marked release-complete until a working CI or deploy environment provides clean install, lint, typecheck, test, app build, functions build, deploy, and live smoke receipts for the current commit or newer.
