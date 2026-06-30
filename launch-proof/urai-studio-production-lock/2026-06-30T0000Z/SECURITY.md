# URAI Studio security audit

Recorded: 2026-06-30

## Auth and admin posture

- Production Studio API calls require a Firebase bearer token through `requireStudioAuth`.
- Non-production requests can use a local fallback identity for development only.
- `/admin` and `/studio/admin` are UI-gated by `NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED` / `STUDIO_ADMIN_QA_ENABLED`.
- Firebase callable functions require authenticated users for Studio actions.
- Selected admin callables use an admin custom claim check.

## Important risk note

The public admin QA routes are hidden by environment flag, but environment-flag UI gating is not a complete production authorization model by itself. Any production admin action must remain server-side role/claim protected and should be smoke-tested with both allowed and denied identities before READY status.

## Firestore posture

- Runtime system-contract collections `studioBriefs`, `studioJobs`, and `studioExports` deny direct client read/write access.
- Public form collections `waitlist`, `contactRequests`, `projectRequests`, and `integrationRequests` deny direct client SDK read/write and are intended to be written through trusted server routes.
- Legacy Studio collections use uid ownership checks.
- Membership-scoped collections exist for studios, jobs, assets, outputs, dead letters, and audit logs.

## Storage posture

- `/studios/{studioId}/uploads/**` and `/studios/{studioId}/outputs/**` require studio membership.
- `/user-uploads/{uid}/studio/**` requires matching authenticated uid.
- `/generated/{uid}/studio/**` allows matching uid read and denies direct client write.
- `/public/studio-assets/**` is publicly readable and not client-writable.

## Secret handling

- README documents public `NEXT_PUBLIC_*` values separately from server-only Firebase service account values.
- `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` are documented as env values, not hardcoded in inspected files.

## Upload validation

- Storage access rules are present, but this pass did not find complete MIME/type/size validation proof for uploads at the application/API layer.
- P0/P1 recommendation: add server-side upload validation and signed upload contracts before claiming production asset ingestion.

## Security verdict

Security posture is PARTIAL: strong denial defaults and server-owned runtime collections are present, but complete production admin authorization proof, upload validation, membership-role end-to-end smoke testing, and live deployment evidence are still required.