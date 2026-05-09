import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Generate',
  description: 'Feature-gated creative generation intake for URAI Studio jobs.',
};

const modes = ['Visual system', 'Motion concept', 'Cinema treatment', 'Music direction', 'Spatial scene'];

const presets = [
  'Cinematic launch reel',
  'Spatial product scene',
  'Symbolic memory visual',
  'Brand asset pack',
];

export default function GeneratePage() {
  const liveGenerationConfigured = Boolean(
    process.env.STUDIO_GENERATION_ENDPOINT && process.env.STUDIO_GENERATION_API_KEY,
  );

  return (
    <section data-urai-studio-page="generate" className="page-stack">
      <p className="eyebrow">Generate</p>
      <h1>Shape a production-ready creative brief.</h1>
      <p className="hero-lede">
        Use this production-safe intake surface to prepare prompts, presets, and creative requirements before a live
        Asset Factory or render queue is connected. The page clearly reports whether live generation infrastructure is
        configured.
      </p>

      <div className="grid feature-grid">
        <article className="card">
          <h2>Creative prompt</h2>
          <label htmlFor="studio-prompt">Describe the asset, scene, motion path, audio identity, or campaign system you want URAI Studio to produce.</label>
          <textarea
            id="studio-prompt"
            name="prompt"
            rows={7}
            placeholder="Example: a cinematic URAI Studio launch scene with glass UI, memory constellations, and spatial light trails"
            aria-describedby="generate-state"
          />

          <div className="grid" aria-label="Generation mode presets">
            {modes.map((mode) => (
              <button className="button button-secondary" type="button" key={mode}>
                {mode}
              </button>
            ))}
          </div>

          <p id="generate-state">
            {liveGenerationConfigured
              ? 'Live generation endpoint detected. Wire this form to create StudioJob records and queue rendering.'
              : 'Live generation is not configured yet. Set STUDIO_GENERATION_ENDPOINT and STUDIO_GENERATION_API_KEY, then connect the StudioJob queue.'}
          </p>
        </article>

        <article className="card">
          <h2>Production presets</h2>
          <div className="grid">
            {presets.map((preset) => (
              <span className="badge badge-live" key={preset}>
                {preset}
              </span>
            ))}
          </div>
          <p>
            When generation APIs are enabled, this page should create a StudioJob, enqueue rendering, and surface
            success, error, and rollback states.
          </p>
          <Link className="button button-primary" href={liveGenerationConfigured ? '/jobs' : '/contact'}>
            {liveGenerationConfigured ? 'Review Jobs' : 'Request Production Setup'}
          </Link>
        </article>
      </div>
    </section>
  );
}