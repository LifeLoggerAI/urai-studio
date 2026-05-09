import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'URAI Studio is the premium creative studio layer of the URAI system-of-systems.',
};

export default function AboutPage() {
  return (
    <section data-urai-studio-page="about" className="page-stack">
      <p className="eyebrow">About URAI Studio</p>
      <h1>Creative infrastructure for the broader URAI ecosystem.</h1>
      <p className="hero-lede">
        URAI Studio turns brand, memory, motion, spatial, and generated-media workflows into polished production
        systems. It stands alone at www.uraistudio.com while connecting cleanly to URAI, URAI Spatial, URAI Jobs,
        Asset Factory, Analytics, Admin, Privacy, Foundation, and future enterprise API workflows.
      </p>

      <div className="grid feature-grid">
        <article className="card">
          <h2>Standalone studio</h2>
          <p>
            A premium public website and application surface for cinematic AI-native creative operations, launches,
            demos, production briefs, creators, teams, and enterprise partners.
          </p>
        </article>

        <article className="card">
          <h2>System-of-systems node</h2>
          <p>
            A typed integration surface for shared jobs, assets, manifests, health checks, capabilities, generated
            media workflows, spatial storytelling, and future account, billing, or API workflows.
          </p>
        </article>

        <article className="card">
          <h2>Honest production state</h2>
          <p>
            Live backends are wired when configuration exists. Unavailable generation, billing, auth, and storage
            systems are feature-gated instead of simulated, with clear metadata, smoke-testable routes, and deployment
            notes.
          </p>
        </article>
      </div>

      <div className="launch-panel">
        <div>
          <h2>Ready to build the next layer?</h2>
          <p>Use the integration contract and system APIs to connect production services safely.</p>
        </div>
        <Link className="button button-primary" href="/systems">
          View System Contract
        </Link>
      </div>
    </section>
  );
}