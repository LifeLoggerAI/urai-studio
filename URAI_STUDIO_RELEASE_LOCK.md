# URAI Studio Release Lock

Status: fail-closed release authority for `LifeLoggerAI/urai-studio`.

This document is a governance boundary. It is not runtime code, a credential recipe, deployment approval, or proof that any provider resource is configured.

## Credential authority

URAI Studio production and protected nonproduction workflows must use short-lived Google identity only:

- GitHub Actions: OIDC + Workload Identity Federation with protected environment variables and least-privilege IAM.
- Google-managed runtime: provider metadata / Application Default Credentials where the deployment platform supplies the identity.
- Authorized local verification: Application Default Credentials only after the active account and project are explicitly checked.

The following are forbidden as deployment/runtime authority:

- `FIREBASE_PRIVATE_KEY`;
- `FIREBASE_CLIENT_EMAIL` paired with private-key material;
- `FIREBASE_SERVICE_ACCOUNT_KEY`;
- raw service-account JSON or base64 service-account JSON;
- `credentials_json` workflow inputs/secrets;
- `FIREBASE_TOKEN` as a production deployment substitute;
- committed credential files or copied provider keys.

Missing WIF/ADC identity is a blocker. Do not bypass it with a long-lived credential.

## Release prerequisites

No Studio production or provider mutation is authorized unless all applicable gates are simultaneously true on one unchanged exact candidate SHA:

1. exact-head CI, audit, security, privacy, and release verification are terminal-success;
2. all technical review threads are resolved;
3. required independent approval covers that exact head;
4. migration and tenant-isolation evidence is retained for the exact candidate;
5. protected WIF/ADC identity and least-privilege IAM are verified;
6. target project, storage boundary, hosting/runtime target, and environment are exact and non-ambiguous;
7. provider secrets are referenced only through protected provider-native mechanisms and are never read back into evidence;
8. deployment authority is explicit and scoped to the intended environment;
9. exact deployed SHA/revision can be read back from the provider/runtime;
10. monitoring, recovery, and a distinct rollback revision are proven before completion is claimed.

Source-green, preview output, a reachable URL, or a prior-head approval does not satisfy these gates.

## Migration and data boundary

- Do not perform production migration from source CI.
- Do not copy customer/private media into test evidence.
- Test and staging evidence must use synthetic or explicitly authorized nonproduction data.
- Tenant isolation, ownership, consent, retention, deletion/export, and media-rights rules remain separate release gates.
- A migration must be reversible or have a documented recovery plan before execution.

## Provider/deployment boundary

Verification workflows may inspect source and credential-free contracts but must not silently gain deployment authority. Any workflow that can mutate a provider must be protected, exact-SHA bound, environment-scoped, and independently authorized by the repository's current governance.

Never infer production completion from Firebase/GCP project existence, a domain, a repository setting, or provider account access alone.

## Exact-head rule

Any source write creates a successor. When the head changes, predecessor CI, reviews, migration receipts, provider receipts, screenshots, deployment evidence, and approvals are historical only unless a governing contract explicitly and truthfully supports transfer. Default behavior is **no transfer**.

## Current classification

**SOURCE GOVERNED / LONG-LIVED FIREBASE CREDENTIALS FORBIDDEN / PROVIDER + MIGRATION + RUNTIME + REVIEW EVIDENCE REQUIRED / NO DEPLOYMENT AUTHORITY FROM THIS FILE.**
