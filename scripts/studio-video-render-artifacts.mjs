import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.STUDIO_BASE_URL || 'http://127.0.0.1:3000';
const outDir = process.env.VIDEO_FACTORY_OUT_DIR || '_audit/20260623_urai_studio_video_factory/render-artifacts';
const bearerToken = process.env.STUDIO_API_BEARER_TOKEN?.trim();
const studioId = process.env.STUDIO_ID?.trim();

async function main() {
  const url = new URL('/api/studio/video-factory/render', baseUrl);
  const productionTarget = url.hostname !== '127.0.0.1' && url.hostname !== 'localhost';
  if (productionTarget && !bearerToken) {
    throw new Error('STUDIO_API_BEARER_TOKEN is required for a deployed render package request');
  }
  const response = await fetch(url, {
    headers: {
      ...(bearerToken ? {Authorization: `Bearer ${bearerToken}`} : {}),
      ...(studioId ? {'x-urai-studio-id': studioId} : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`render_package_fetch_failed:${response.status}`);
  }

  const renderPackage = await response.json();
  await fs.mkdir(outDir, { recursive: true });

  const manifestPath = path.join(outDir, 'urai-replay-teaser.render-manifest.json');
  const srtPath = path.join(outDir, 'urai-replay-teaser.captions.srt');
  const binaryRenderReceiptPath = path.join(outDir, 'urai-replay-teaser.binary-render-receipt.json');
  const plannedMp4 = renderPackage.artifacts?.find((artifact) => artifact.kind === 'mp4')?.storagePath || null;

  await fs.writeFile(manifestPath, JSON.stringify(renderPackage.exportManifest, null, 2) + '\n');
  await fs.writeFile(srtPath, renderPackage.subtitleText + '\n');
  await fs.writeFile(
    binaryRenderReceiptPath,
    JSON.stringify(
      {
        schemaVersion: 'urai-studio-binary-render-receipt-1',
        recordedAt: new Date().toISOString(),
        status: 'not-rendered',
        playable: false,
        reason: 'Playwright plus FFmpeg composition did not run in this contract-only artifact command.',
        requiredComposer: 'playwright-ffmpeg',
        renderPackageSource: url.toString(),
        plannedMp4,
        filesWritten: [manifestPath, srtPath],
      },
      null,
      2,
    ) + '\n',
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        manifestPath,
        srtPath,
        binaryRenderReceiptPath,
        playableMp4Written: false,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
