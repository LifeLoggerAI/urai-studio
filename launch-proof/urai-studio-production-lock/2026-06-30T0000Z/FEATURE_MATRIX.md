# URAI Studio feature matrix

Recorded: 2026-06-30

| Feature | Status | Evidence / rationale | Release claim allowed |
|---|---:|---|---|
| Public Studio shell | DONE/PARTIAL | Next app exists under `apps/studio`; public route smoke list covers `/studio`, `/studio/projects`, `/studio/assets`, `/studio/exports`, `/studio/xr`, module pages, status, privacy, and terms. | Yes: public Studio shell / module surface. |
| Creator dashboard | PARTIAL | Dashboard callable reads user-scoped project/assets/scroll/export collections, but live dashboard behavior was not smoke-tested here. | Limited: dashboard foundation. |
| Content editor | PARTIAL/MOCK | Studio project, scenes, scrolls, narration, scripts, and generated text records exist, but no verified rich editor/publishing workflow was proven. | No full editor claim. |
| Asset generation/import | MOCK/PARTIAL | Asset jobs can be queued; job runner and functions produce fallback or recorded records, not verified external generation. | No real asset generation claim. |
| Media generation | MOCK/BLOCKED | Fallback job outputs are text/manifest placeholders and `readyForExternalUse: false`. | No real media generation claim. |
| Publishing | NOT STARTED/PARTIAL | Publish job is fallback-only; no verified public publish, revoke, download, or permissioned delivery flow. | No production publishing claim. |
| Export manifest | PARTIAL | Export APIs can create queued records and return fallback Spatial handoff manifests; callable `processExportJob` creates a manifest record. | Yes: fallback-safe export manifest contract. |
| Download/export authorization | BLOCKED | Export data includes storagePath/downloadUrl fields but real download URLs and authorization proof are not complete. | No real downloadable export claim. |
| Templates | PARTIAL | Demo seed creates scenes/assets/scripts/scroll records; not a validated template marketplace/editor. | Demo templates only. |
| Account/auth | PARTIAL | Firebase anonymous/client auth and production bearer token requirement exist; full account UX and role membership proof incomplete. | Limited Firebase auth foundation. |
| Admin/operator flows | GATED/PARTIAL | `/admin` and `/studio/admin` are disabled unless QA env flag is enabled. Callable admin functions require admin custom claim for selected actions. | Gated QA/operator surface only. |
| Jobs/worker infrastructure | PARTIAL/MOCK | Functions job runner exists but consumes `jobs` collection while Studio API runtime uses `studioJobs`; fallback outputs only. | No live production worker claim. |
| Persistence | PARTIAL | Firestore Admin writes project/job/export/brief records when configured; production returns 503 if runtime store unavailable. | Yes, conditional on Firebase Admin config. |
| Firestore rules | PARTIAL/DONE | Rules deny direct client writes to server-owned runtime collections and uid/membership-scope legacy collections. | Yes: guarded rule posture. |
| Storage rules | PARTIAL/DONE | Storage rules restrict uploads/outputs to members or uid; generated outputs are read-only to matching uid; public assets read-only. | Yes: guarded storage posture. |
| Asset Factory integration | PARTIAL/GATED | Ecosystem URL keys and integration registry exist; no verified live cross-repo asset factory call. | Contract-level integration only. |
| Content integration | PARTIAL/GATED | URL/config contract exists; no verified content publishing runtime. | Contract-level only. |
| Marketing integration | PARTIAL/GATED | URL/config contract exists; no verified funnel data path in this pass. | Contract-level only. |
| Spatial/XR handoff | PARTIAL | `/api/system/spatial-handoff`, OpenAPI/discovery docs, and fallback manifest support exist; real XR runtime validation not proven here. | Fallback handoff contract only. |
| Billing | BLOCKED | Stripe dependency/env docs exist, but billing configuration, checkout, metering, and webhook proof were not found. | No billing-ready claim. |
| Live deployment | BLOCKED | App Hosting config points to `https://www.uraistudio.com`, but live deployment proof was not recorded. | No live production proof claim. |
| CI/release lock | BLOCKED | Repo has release/check scripts and evidence schemas; current CI/workflow runs were not found for inspected latest commit. | No final lock claim. |

## Summary

URAI Studio has a meaningful real foundation but must stay labeled PARTIAL until provider generation, real publishing/export/download, billing, full auth/role enforcement, current CI, and live deployment proof are completed.