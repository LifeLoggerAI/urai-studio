# URAI Studio System Map

## Structure

- Root package: pnpm monorepo.
- App: `apps/studio` Next.js Studio surface.
- Backend: `functions` Firebase Cloud Functions.
- Rules: `firestore.rules` and `storage.rules`.
- Indexes: `firestore.indexes.json`.
- Smoke test: `scripts/studio-smoke-test.js`.

## Main Flows

1. User opens URAI Studio.
2. Firebase Auth identifies the user.
3. Studio callables create projects, scenes, assets, scripts, scrolls, and export jobs.
4. Firestore stores user-owned records.
5. Storage stores user uploads and generated outputs.
6. Export jobs produce a manifest for downstream publishing.

## Cloud Functions

- `ping`
- `createStudioProject`
- `seedStudioDemo`
- `generateStudioScript`
- `generateSceneNarration`
- `generateSrtForProject`
- `generateCompanionIntro`
- `createAssetJob`
- `markAssetReady`
- `createExportJob`
- `processExportJob`
- `getExportJobStatus`
- `getStudioDashboard`
- `logStudioEvent`

## Verification Commands

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm --dir functions build`
- `pnpm studio:smoke`
