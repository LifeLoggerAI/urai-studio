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
