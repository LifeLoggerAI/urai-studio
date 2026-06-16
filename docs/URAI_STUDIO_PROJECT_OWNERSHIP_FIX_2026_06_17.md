# URAI Studio Project Ownership Fix Evidence

Date: 2026-06-17
Repository: `LifeLoggerAI/urai-studio`

## Code state confirmed through GitHub connector

`functions/src/create-job.ts` now validates the job payload and checks project ownership before creating the job.

The ownership check reads `projects/{projectId}` and requires `ownerUid` to match the authenticated caller. If the project is missing, the function throws `not-found`. If the caller does not own the project, the function throws `permission-denied`.

The check runs after payload normalization and before job and audit-log writes. This closes the earlier tenant/project isolation gap for Studio job creation.

## Still requiring verification

This connector pass did not run `pnpm --dir functions build`, tests, lint, typecheck, deploy, or live smoke.

One follow-up remains: replace or verify the `FirebaseFirestore.Firestore` type annotation in `functions/src/create-job.ts` during a real Functions TypeScript build. If the namespace is unavailable under the current strict Functions config, use a local type alias derived from `admin.firestore()`.

## Done-done status

Not done-done. The project ownership fix is implemented in code, but build and test evidence still must be recorded before production completion can be claimed.
