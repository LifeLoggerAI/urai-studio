import Link from 'next/link';

import { buildVideoFactoryRenderPackage } from '@/lib/studio-video-renderer';

export function RenderArtifactPanel() {
  const renderPackage = buildVideoFactoryRenderPackage({ mode: 'contract-only' });

  return (
    <section className="section-panel" data-video-factory-render-panel>
      <div className="section-heading">
        <p className="eyebrow">Render artifacts</p>
        <h2>Deterministic package before binary MP4 composition.</h2>
        <p>
          The render API produces the timeline, captions, JSON manifest, planned MP4 path, and command plan. The local artifact composer writes JSON and SRT files and an MP4 placeholder when FFmpeg composition is not available.
        </p>
      </div>
      <div className="cta-row" aria-label="Video Factory render links">
        <Link className="button button-secondary" href="/api/studio/video-factory/render">
          Render Package API
        </Link>
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
        {`STUDIO_BASE_URL=http://127.0.0.1:3000 node scripts/studio-video-render-artifacts.mjs`}
      </pre>
    </section>
  );
}
