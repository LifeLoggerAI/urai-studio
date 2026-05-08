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
        URAI Studio is the public and professional creative studio layer of URAI: a cinematic workspace for generated media, asset operations, spatial storytelling, motion systems, and enterprise-grade creative workflows.
      </p>
      <div className="grid">
        <article className="card"><h2>Standalone studio</h2><p>Designed to operate at www.uraistudio.com as a premium website and application surface for creators, teams, and enterprise partners.</p></article>
        <article className="card"><h2>System-of-systems role</h2><p>Connects cleanly to Asset Factory, URAI Spatial, URAI Jobs, Analytics, Admin, Privacy, Foundation, and future API workflows.</p></article>
        <article className="card"><h2>Honest production state</h2><p>Live backends are wired when configuration exists. Unavailable generation, billing, auth, and storage systems are feature-gated instead of simulated.</p></article>
      </div>
      <div className="launch-panel"><div><h2>Ready to build the next layer?</h2><p>Use the integration contract and system APIs to connect production services safely.</p></div><Link className="button button-primary" href="/system">View System Contract</Link></div>
    </section>
  );
}
