import type { Metadata } from 'next';
import Link from 'next/link';

import {
  DEFAULT_VIDEO_FACTORY_TEMPLATE_ID,
  URAI_REPLAY_TEASER_TEMPLATE,
  buildVideoFactoryPrompt,
  sumShotDurationsSeconds,
  validateVideoFactoryManifest,
} from '@/lib/studio-video-factory';

export const metadata: Metadata = {
  title: 'Studio Video Factory',
  description:
    'URAI Studio Video Factory template surface for the canonical Replay teaser, route captures, assets, shots, voiceover, exports, and queue instructions.',
  alternates: {
    canonical: '/studio/video-factory',
  },
};

const template = URAI_REPLAY_TEASER_TEMPLATE;
const validation = validateVideoFactoryManifest(template);
const shotDurationSeconds = sumShotDurationsSeconds(template);
const queuePayload = {
  templateId: DEFAULT_VIDEO_FACTORY_TEMPLATE_ID,
  prompt: template.defaultPrompt,
};

export default function StudioVideoFactoryPage() {
  return (
    <section data-urai-studio-page="video-factory" className="page-stack">
      <p className="eyebrow">Studio Video Factory</p>
      <h1>{template.title}</h1>
      <p className="hero-lede">{template.description}</p>

      <div className="cta-row" aria-label="Video Factory navigation">
        <Link className="button button-secondary" href="/studio">
          Back to Studio
        </Link>
        <Link className="button button-primary" href="/api/studio/video-factory">
          Inspect API Contract
        </Link>
      </div>

      <div className="grid three">
        <article className={`card status-${validation.ok ? 'success' : 'error'}`}>
          <p className="eyebrow">Manifest validation</p>
          <h2>{validation.ok ? 'Ready' : 'Blocked'}</h2>
          <p>{validation.ok ? 'No duplicate route, asset, shot, duration, or export errors.' : validation.errors.join(', ')}</p>
        </article>
        <article className="card">
          <p className="eyebrow">Duration</p>
          <h2>{shotDurationSeconds}s</h2>
          <p>The shot list must equal the declared thirty-second teaser duration.</p>
        </article>
        <article className="card">
          <p className="eyebrow">Exports</p>
          <h2>{template.requestedExports.join(' · ')}</h2>
          <p>Video Factory requests video, subtitle, and manifest outputs through the Studio job contract.</p>
        </article>
      </div>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Route captures</p>
          <h2>Spatial source once, no duplicate Home capture.</h2>
          <p>
            The template uses /home as the canonical Home World route and intentionally does not capture both / and /home.
          </p>
        </div>
        <div className="grid three">
          {template.routeCaptures.map((capture) => (
            <article className="card" key={capture.id}>
              <p className="eyebrow">{capture.captureMode}</p>
              <h3>{capture.label}</h3>
              <p><code>{capture.route}</code></p>
              <p>{capture.notes}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Shot plan</p>
          <h2>Thirty seconds from Home World to proof.</h2>
        </div>
        <div className="grid">
          {template.shots.map((shot) => (
            <article className="card" key={shot.id}>
              <p className="eyebrow">{shot.durationSeconds}s · {shot.routeCaptureId}</p>
              <h3>{shot.caption}</h3>
              <p>{shot.cameraDirection}</p>
              <p>Assets: {shot.assetPromptIds.join(' · ')}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Asset prompts</p>
          <h2>Generated support material.</h2>
        </div>
        <div className="grid two">
          {template.assetPrompts.map((asset) => (
            <article className="card" key={asset.id}>
              <p className="eyebrow">{asset.kind}</p>
              <h3>{asset.title}</h3>
              <p>{asset.prompt}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Queue contract</p>
          <h2>Use the existing Studio API to queue the job.</h2>
          <p>
            The API endpoint validates this manifest, builds the canonical prompt, and queues through createStudioJob.
          </p>
        </div>
        <pre className="card code-block" aria-label="Video Factory queue payload">
          {JSON.stringify(queuePayload, null, 2)}
        </pre>
        <pre className="card code-block" aria-label="Video Factory generated prompt">
          {buildVideoFactoryPrompt(template)}
        </pre>
      </section>
    </section>
  );
}
