import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.STUDIO_BASE_URL || 'http://127.0.0.1:3000';
const outDir = process.env.VIDEO_FACTORY_OUT_DIR || '_audit/20260623_urai_studio_video_factory/render-artifacts';

async function main() {
  const url = new URL('/api/studio/video-factory/render', baseUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`render_package_fetch_failed:${response.status}`);
  }

  const renderPackage = await response.json();
  await fs.mkdir(outDir, { recursive: true });

  const manifestPath = path.join(outDir, 'urai-replay-teaser.render-manifest.json');
  const srtPath = path.join(outDir, 'urai-replay-teaser.captions.srt');
  const mp4PlaceholderPath = path.join(outDir, 'urai-replay-teaser.mp4.placeholder.txt');

  await fs.writeFile(manifestPath, JSON.stringify(renderPackage.exportManifest, null, 2) + '\n');
  await fs.writeFile(srtPath, renderPackage.subtitleText + '\n');
  await fs.writeFile(
    mp4PlaceholderPath,
    [
      'URAI Replay Teaser MP4 placeholder',
      '',
      'The deterministic manifest and SRT artifacts were produced.',
      'A binary MP4 requires the Playwright plus FFmpeg composer path.',
      `Render package source: ${url.toString()}`,
      `Planned MP4: ${renderPackage.artifacts?.find((artifact) => artifact.kind === 'mp4')?.storagePath || 'not-planned'}`,
    ].join('\n') + '\n',
  );

  console.log(JSON.stringify({ ok: true, manifestPath, srtPath, mp4PlaceholderPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
