import Link from 'next/link';

const presets = [
  'Cinematic launch reel',
  'Spatial product scene',
  'Symbolic memory visual',
  'Brand asset pack',
];

export default function GeneratePage() {
  return (
    <section data-urai-studio-page="generate">
      <p className="eyebrow">Generate</p>
      <h1>Shape a production-ready creative brief.</h1>
      <p>
        Use this safe intake surface to prepare prompts, presets, and production requirements before a live
        Asset Factory or render queue is connected. The page does not pretend to submit unavailable backends.
      </p>

      <div className="grid feature-grid">
        <article className="card">
          <h2>Creative prompt</h2>
          <label htmlFor="studio-prompt">Describe the asset, scene, or system you want to create.</label>
          <textarea
            id="studio-prompt"
            name="prompt"
            rows={7}
            placeholder="Example: a cinematic URAI Studio launch scene with glass UI, memory constellations, and spatial light trails"
            aria-describedby="generate-help"
          />
          <p id="generate-help">
            Live submission is feature-gated until a configured generation endpoint is present.
          </p>
        </article>

        <article className="card">
          <h2>Production presets</h2>
          <div className="grid">
            {presets.map((preset) => (
              <span className="badge badge-live" key={preset}>{preset}</span>
            ))}
          </div>
          <p>
            When generation APIs are enabled, this page should create a StudioJob, enqueue rendering, and surface
            success, error, and rollback states.
          </p>
          <Link className="button button-primary" href="/contact">Request production access</Link>
        </article>
      </div>
    </section>
  );
}
