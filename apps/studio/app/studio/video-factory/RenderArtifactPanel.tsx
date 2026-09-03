import Link from 'next/link';

import { buildVideoFactoryRenderPackage } from '@/lib/studio-video-renderer';
import { RenderPackageButton } from './RenderPackageButton';

export function RenderArtifactPanel() {
  const renderPackage = buildVideoFactoryRenderPackage({ mode: 'contract-only' });

  return (
    <section className="section-panel" data-video-factory-render-panel>
      <div className="section-heading">
        <p className="eyebrow">Render artifacts</p>
        <h2>Deterministic package before binary MP4 composition.</h2>
        <p>
          The render API produces the timeline, captions, JSON manifest, planned MP4 path, and command plan. The local artifact composer writes the manifest, captions, and a non-playable binary-render receipt. It does not write or represent a playable MP4 unless the Playwright plus FFmpeg composition path completes successfully.
        </p>
      </div>
      <div className="cta-row" aria-label="Video Factory render links">
        <RenderPackageButton />
        <Link className="button button-secondary" href="/api/studio/video-factory/assets">
          Asset Factory Status
        </Link>
      </div>
      <div className="grid three">
        {renderPackage.artifacts.map((artifact) => (
          <article className="card" key={artifact.storagePath}>
            <p className="eyebrow">{artifact.kind}</p>
            <h3>{artifact.filename}</h3>
            <p><code>{artifact.storagePath}</code></p>
            <p>{artifact.notes}</p>
          </article>
        ))}
      </div>
      <pre className="card code-block" aria-label="Video Factory artifact command">
        {`STUDIO_BASE_URL=http://127.0.0.1:3000 node scripts/studio-video-render-artifacts.mjs\nSTUDIO_BASE_URL=https://studio.example STUDIO_API_BEARER_TOKEN=<firebase-id-token> STUDIO_ID=<studio-id> node scripts/studio-video-render-artifacts.mjs`}
      </pre>
    </section>
  );
}
