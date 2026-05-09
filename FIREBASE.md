# URAI Studio Firebase Map

## Hosting

- Source: `apps/studio`
- Config: `firebase.json`

## Functions

- Source: `functions`
- Runtime: Node 20
- Build command: `pnpm --dir functions build`

Callable functions added for Studio system workflows:

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

## Firestore Collections

### Authenticated Studio collections

- `users`
- `studioProjects`
- `studioScenes`
- `studioAssets`
- `assetJobs`
- `assetCollections`
- `studioScrolls`
- `narratorScripts`
- `subtitles`
- `voiceoverJobs`
- `exportJobs`
- `studioEvents`
- `catalogs`
- `remoteConfigMirror`
- `xrSessions`
- `vrSessions`

### Public submission collections

These collections are written only by trusted server routes through Firebase Admin. Client SDK access is explicitly denied in `firestore.rules`.

- `waitlist`
  - Written by: `apps/studio/app/api/waitlist/route.ts`
  - Duplicate check: `where('email', '==', email).limit(1)`
  - Composite index required: no
  - Client rule: `allow read, write: if false;`
- `contactMessages`
  - Written by: `apps/studio/app/api/contact/route.ts`
  - Query pattern: write-only through server route
  - Composite index required: no
  - Client rule: `allow read, write: if false;`

## Firestore Indexes

`firestore.indexes.json` covers the authenticated Studio query patterns that require composite indexes, including project, asset, scene, export, scroll, and job lookups.

The public submission collections do not need composite indexes at this time:

- `waitlist` uses a single-field equality duplicate check on `email`, which Firestore supports through automatic single-field indexing.
- `contactMessages` is write-only through the server route and currently has no client or dashboard query path.

Do not add composite indexes for public submission collections unless a real dashboard/query path is implemented.

## Storage Paths

- `user-uploads/{uid}/studio/**`
- `generated/{uid}/studio/**`
- `public/studio-assets/**`
- `studios/{studioId}/uploads/**`
- `studios/{studioId}/outputs/**`

## Deploy Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
pnpm studio:smoke
firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting
```
