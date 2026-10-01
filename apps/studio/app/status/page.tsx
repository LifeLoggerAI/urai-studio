import type { Metadata } from 'next';
import Link from 'next/link';

import { buildReadinessProfile, observeAllStudioIntegrations } from '@/lib/studio/observed-readiness';
import { readinessSummary } from '@/lib/studio/status';
import { proofPoints } from '@/lib/studio/system-of-systems';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Status',
  description: 'URAI Studio public status, system confidence, and production integration posture.',
  alternates: {
    canonical: '/status',
  },
};

export default async function StatusPage() {
  const local = readinessSummary();
  const observations = await observeAllStudioIntegrations();
  const fullPlatform = buildReadinessProfile('FULL_STUDIO_PLATFORM', observations);
  const healthyCount = observations.filter((item) => item.state === 'healthy').length;

  const localLabel = local.ok ? 'Ready' : 'Degraded';
  const platformLabel = fullPlatform.ok ? 'Observed healthy' : 'Evidence incomplete';

  return (
    <section data-urai-studio-page="status" className="page-stack">
      <p className="eyebrow">System status</p>
      <h1>URAI Studio diagnostics</h1>
      <p className="hero-lede">
        Public status separates local Studio readiness from downstream integration proof. Configuration alone never counts as observed health.
      </p>

      <div className="grid three">
        <article className="card">
          <p className="eyebrow">Local readiness</p>
          <h2>{localLabel}</h2>
          <p>{local.ok ? 'The local Studio readiness contract has no required blockers.' : 'One or more required local readiness checks are blocked.'}</p>
        </article>
        <article className="card">
          <p className="eyebrow">Full platform</p>
          <h2>{platformLabel}</h2>
          <p>{fullPlatform.ok ? 'Every required downstream integration in this profile was observed healthy.' : 'Required downstream health has not all been observed healthy.'}</p>
        </article>
        <article className="card">
          <p className="eyebrow">Observed integrations</p>
          <h2>{healthyCount} / {observations.length}</h2>
          <p>Healthy is awarded only after a bounded server-side health observation.</p>
        </article>
      </div>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Readiness profiles</p>
          <h2>Proof stays scoped to the operation.</h2>
          <p>Provider execution, Spatial handoff, and media production remain separately hard-off even when a downstream health check succeeds.</p>
        </div>
        <div className="cta-row">
          <Link className="button button-secondary" href="/readyz?profile=PUBLIC_SITE">Public site readiness</Link>
          <Link className="button button-secondary" href="/readyz?profile=FULL_STUDIO_PLATFORM">Full platform readiness</Link>
          <Link className="button button-secondary" href="/readyz?profile=PROVIDER_EXECUTION">Provider execution gate</Link>
          <Link className="button button-secondary" href="/readyz?profile=SPATIAL_HANDOFF">Spatial handoff gate</Link>
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
