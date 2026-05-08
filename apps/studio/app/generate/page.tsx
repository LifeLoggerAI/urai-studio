import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Generate',
  description: 'Feature-gated creative generation intake for URAI Studio jobs.',
};

const modes = ['Visual system', 'Motion concept', 'Cinema treatment', 'Music direction', 'Spatial scene'];

export default function GeneratePage() {
  const liveGenerationConfigured = Boolean(process.env.STUDIO_GENERATION_ENDPOINT && process.env.STUDIO_GENERATION_API_KEY);

  return (
    <section data-urai-studio-page="generate" className="page-stack">
      <p className="eyebrow">Generate</p>
      <h1>Start a Studio job intake.</h1>
      <p className="hero-lede">
        This page is production-safe: it collects the shape of a creative request and clearly reports whether live generation infrastructure is configured.
      </p>
      <div className="card">
        <label htmlFor="prompt"><strong>Creative prompt</strong></label>
        <textarea id="prompt" name="prompt" rows={6} placeholder="Describe the asset, scene, motion path, audio identity, or campaign system you want URAI Studio to produce." aria-describedby="generate-state" />
        <div className="grid" aria-label="Generation mode presets">
          {modes.map((mode) => <button className="button button-secondary" type="button" key={mode}>{mode}</button>)}
        </div>
        <p id="generate-state">
          {liveGenerationConfigured ? 'Live generation endpoint detected. Wire this form to create StudioJob records and queue rendering.' : 'Live generation is not configured yet. Set STUDIO_GENERATION_ENDPOINT and STUDIO_GENERATION_API_KEY, then connect the StudioJob queue.'}
        </p>
        <Link className="button button-primary" href={liveGenerationConfigured ? '/jobs' : '/contact'}>{liveGenerationConfigured ? 'Review Jobs' : 'Request Production Setup'}</Link>
      </div>
    </section>
  );
}
