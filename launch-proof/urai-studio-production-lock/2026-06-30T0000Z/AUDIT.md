# URAI Studio production-lock audit

Recorded: 2026-06-30
Repo: LifeLoggerAI/urai-studio
Default branch: main
Latest commit identified by repository search: 97b6dac6c976ec09be2842d6083d76cf03e56bb0 — Record Studio runtime gate evidence
Verdict: PARTIAL / NOT READY for public production release
Readiness score: 62 / 100

## Executive verdict

URAI Studio is a real Next.js + Firebase/Firebase Functions Studio foundation with documented contracts, route coverage, Firebase-backed submission/persistence paths, admin QA gating, Firestore/Storage rules, system health endpoints, and Studio/Spatial handoff contract routes.

It is not a fully production-ready creator/operator studio yet. The current repo proves a hardened shell and integration foundation, not complete real media generation, editing, publishing, billing, or external provider pipelines. The job runner and callable flows intentionally produce fallback/demo/contract-only artifacts in several places. The repo also lacks fresh CI, install, build, Functions build, deployment, and live smoke evidence for the current commit.

## What was inspected

- Root package scripts and workspace runtime configuration.
- Canonical app package: apps/studio/package.json.
- README release-status language and environment docs.
- Done-done lock contract.
- Studio remaining blockers note.
- Studio smoke guard expected file list.
- API routes for Studio jobs and exports.
- Studio runtime store.
- Studio auth helper.
- Firebase callable implementation.
- Fallback job runner.
- Firestore rules and Storage rules.
- Admin route and Studio admin QA route.
- Firebase App Hosting config and firebase.json.
- Route smoke declaration.

## High-confidence classification

URAI Studio is best classified as:

- Real app/backend foundation: YES.
- Public Studio shell: YES.
- Firebase-backed contact/waitlist/runtime records: PARTIAL to YES, depending on environment config.
- Creator/operator Studio: PARTIAL.
- Asset/content generation pipeline: MOCK / FALLBACK / PARTIAL.
- Publishing pipeline: NOT PRODUCTION READY.
- Admin/operator surface: GATED, but env-flag based UI gating is not a substitute for complete role-protected admin production operation.
- System-of-systems contract hub: PARTIAL but substantial.
- Deployment/live production proof: BLOCKED / NOT RECORDED in this pass.

## Major production blockers

1. No fresh local/CI execution proof was available in this connector session for install, lint, typecheck, tests, app build, Functions build, release:check, or live smoke.
2. No verified live deployment response was recorded for https://www.uraistudio.com or Firebase App Hosting in this pass.
3. Generation/provider integration is not real production generation. Existing outputs include fallback/demo/contract-only behavior.
4. Publishing/export path is contract/fallback oriented and lacks verified asset file persistence/download authorization.
5. Billing dependencies exist, but billing is not proven configured, metered, tested, or release-safe.
6. Admin QA pages are gated by deployment env flags, but full admin role-auth UI and operator flow proof is not complete.
7. Runtime store writes tenant-scoped records server-side, but complete end-user private dashboards, membership claim enforcement, and release smoke evidence are still missing.

## Safe public claim

Safe language: URAI Studio is a launch-safe Studio shell and integration foundation with gated admin QA, Firebase-backed contracts, route coverage, public module pages, and fallback-safe export/spatial handoff contracts.

Unsafe language until blockers clear: fully live creator studio, real media generation studio, production publishing pipeline, complete asset factory, complete admin console, done-done production lock, or public release ready.

## Final result

FINAL VERDICT: PARTIAL — real Studio foundation and contracts exist, but production generation, publishing, billing, deployment proof, and fresh build/test evidence are not complete.