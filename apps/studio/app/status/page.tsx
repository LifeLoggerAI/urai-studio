import type { Metadata } from 'next';
import Link from 'next/link';

import { proofPoints } from '@/lib/studio/system-of-systems';

export const metadata: Metadata = {
  title: 'Status',
  description: 'URAI Studio public status, system confidence, and production integration posture.',
  alternates: {
    canonical: '/status',
  },
};

const publicSignals = [
  'Core website live',
  'System contracts available',
  'Studio actions feature-gated',
  'Generation backends feature-gated',
  'Firebase readiness surfaced',
  'Privacy contract available',
  'Export formats defined',
];

export default function StatusPage() {
  return (
    <section data-urai-studio-page="status" className="page-stack">
      <p className="eyebrow">System status</p>
      <h1>URAI Studio diagnostics</h1>
      <p className="hero-lede">
        Public status is intentionally confidence-focused. Raw Firebase payloads, callable traces, and operator diagnostics stay gated away from public visitors.
      </p>

      <div className="grid three">
        <article className="card status-operational">
          <p className="eyebrow">Health</p>
          <h2>Public shell online</h2>
          <p>Core public website, status routes, system contracts, and integration surfaces are available without claiming unconfigured backends are live.</p>
        </article>
        <article className="card">
          <p className="eyebrow">Service</p>
          <h2>urai-studio</h2>
          <p>Primary public service identity for URAI Studio and integration contract consumers.</p>
        </article>
        <article className="card">
          <p className="eyebrow">Posture</p>
          <h2>Transparent</h2>
          <p>Unconfigured generation, billing, tenant, or external systems are feature-gated instead of faking live status.</p>
        </article>
      </div>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Public signals</p>
          <h2>Launch-facing system confidence.</h2>
        </div>
        <div className="grid feature-grid">
          {publicSignals.map((signal) => (
            <article className="card proof-card" key={signal}>
              <p className="eyebrow">Visible</p>
              <h3>{signal}</h3>
            </article>
          ))}
        </div>
      </section>

      <div className="proof-strip" aria-label="System proof points">
        {proofPoints.map((point) => <span key={point}>{point}</span>)}
      </div>

      <div className="cta-row" aria-label="Status API links">
        <Link className="button button-secondary" href="/api/system/health">Health JSON</Link>
        <Link className="button button-secondary" href="/api/system/manifest">Manifest JSON</Link>
        <Link className="button button-secondary" href="/api/system/capabilities">Capabilities JSON</Link>
        <Link className="button button-primary" href="/api/system/integration-contract">Integration Contract</Link>
        <Link className="button button-secondary" href="/studio/admin">Gated Admin QA</Link>
      </div>
    </section>
  );
}
