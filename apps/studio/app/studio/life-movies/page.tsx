import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { canExecuteStudioFeature } from '@/lib/studio/feature-policy';

export const metadata: Metadata = {
  title: 'Life Movies — URAI Studio',
  description: 'Create private films from your own photos, video, audio, stories, memories, Storytime, and Replay sources.',
  alternates: { canonical: '/studio/life-movies' },
};

const sources = ['Photos', 'Video', 'Audio', 'Transcripts', 'Memories', 'Storytime', 'Replay'];
const stages = ['Select sources', 'Build chapters', 'Review provenance', 'Queue render', 'Preview', 'Export MP4 + captions'];

export default function LifeMoviesPage() {
  if (!canExecuteStudioFeature('life-movies-render')) notFound();

  return (
    <section data-urai-studio-page="life-movies" className="page-stack">
      <p className="eyebrow">URAI Life Movies</p>
      <h1>Your life, assembled as a film.</h1>
      <p className="hero-lede">
        Life Movies is video-first and does not depend on Spatial. It turns approved personal media and memory sources into a private,
        provenance-bound film project with chapters, narration, captions, a deterministic render plan, and ordinary video exports.
      </p>

      <div className="cta-row" aria-label="Life Movies navigation">
        <Link className="button button-secondary" href="/studio">Back to Studio</Link>
        <Link className="button button-primary" href="/api/studio/life-movies">Inspect Life Movies API</Link>
      </div>

      <div className="grid three">
        <article className="card status-success">
          <p className="eyebrow">Spatial</p>
          <h2>Optional</h2>
          <p>Spatial can contribute Replay or product-capture material, but a Life Movie can be created and watched as ordinary video without it.</p>
        </article>
        <article className="card">
          <p className="eyebrow">Default privacy</p>
          <h2>Private</h2>
          <p>Every source requires consent, rights authority, and provenance references before it enters the film plan.</p>
        </article>
        <article className="card">
          <p className="eyebrow">Outputs</p>
          <h2>MP4 · SRT · JSON</h2>
          <p>The launch contract separates the watchable film, captions, and machine-readable provenance/render manifest.</p>
        </article>
      </div>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Source grammar</p>
          <h2>Use the life evidence already in URAI.</h2>
        </div>
        <div className="grid three">
          {sources.map((source) => <article className="card" key={source}><h3>{source}</h3></article>)}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Film path</p>
          <h2>From source selection to a normal video file.</h2>
        </div>
        <ol className="grid two">
          {stages.map((stage, index) => (
            <li className="card" key={stage}>
              <p className="eyebrow">Step {index + 1}</p>
              <h3>{stage}</h3>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Truth boundary</p>
          <h2>Recorded evidence and reconstruction never become the same thing.</h2>
          <p>
            Original, user-provided, verified, remembered, inferred, reconstructed, generated, artistic, and unknown material remain machine-readable provenance states.
            Generated or reconstructed scenes stay provider-gated and cannot self-authorize public release.
          </p>
        </div>
      </section>
    </section>
  );
}
