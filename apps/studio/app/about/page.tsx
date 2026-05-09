import Link from 'next/link';

export default function AboutPage() {
  return (
    <section data-urai-studio-page="about">
      <p className="eyebrow">About</p>
      <h1>URAI Studio is the creative operating layer for the URAI ecosystem.</h1>
      <p>
        URAI Studio turns brand, memory, motion, spatial, and generated-media workflows into polished
        production systems. It stands alone at www.uraistudio.com while connecting cleanly to URAI,
        URAI Spatial, URAI Jobs, Asset Factory, and future enterprise API workflows.
      </p>

      <div className="grid feature-grid">
        <article className="card">
          <h2>Standalone studio</h2>
          <p>
            A premium public website for cinematic AI-native creative operations, launches, demos,
            production briefs, and customer conversations.
          </p>
        </article>
        <article className="card">
          <h2>System-of-systems node</h2>
          <p>
            A typed integration surface for shared jobs, assets, manifests, health checks, capabilities,
            and future account or billing workflows.
          </p>
        </article>
        <article className="card">
          <h2>Production posture</h2>
          <p>
            Clear metadata, safe feature-gating, smoke-testable routes, deployment notes, and no fake
            backend claims where infrastructure is not yet connected.
          </p>
        </article>
      </div>

      <Link className="button button-primary" href="/studio">Explore the studio</Link>
    </section>
  );
}
