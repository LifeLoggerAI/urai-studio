import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Status',
  description: 'URAI Studio system status, health diagnostics, and production integration posture.',
  alternates: {
    canonical: '/status',
  },
};

async function fetchHealth() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/system/health`,
      { cache: 'no-store' },
    );

    if (!res.ok) {
      return { ok: false, error: `health_http_${res.status}` };
    }

    return await res.json();
  } catch {
    return { ok: false, error: 'health_unavailable_in_current_runtime' };
  }
}

export default async function StatusPage() {
  const health = await fetchHealth();
  const isHealthy = Boolean(health?.ok);

  return (
    <section data-urai-studio-page="status" className="page-stack">
      <p className="eyebrow">System status</p>
      <h1>URAI Studio diagnostics</h1>
      <p className="hero-lede">
        Status is contract-driven and intentionally transparent. Unconfigured generation, billing,
        auth, storage, or tenant systems should appear as limited or feature-gated instead of pretending to be live.
      </p>

      <div className="grid">
        <article className="card">
          <p className="eyebrow">Health</p>
          <h2>{isHealthy ? 'Operational' : 'Limited'}</h2>
          <p>
            {isHealthy
              ? 'The health API responded successfully in the current runtime.'
              : 'The health API could not be reached from this runtime. Verify deployment host, NEXT_PUBLIC_SITE_URL, and API routes.'}
          </p>
        </article>
        <article className="card">
          <p className="eyebrow">Service</p>
          <h2>{health?.service || 'urai-studio'}</h2>
          <p>Primary public service identity for www.uraistudio.com and integration contract consumers.</p>
        </article>
        <article className="card">
          <p className="eyebrow">Contracts</p>
          <h2>Available</h2>
          <p>Use manifest, capabilities, integration contract, and OpenAPI endpoints for release verification.</p>
        </article>
      </div>

      <div className="cta-row" aria-label="Status API links">
        <Link className="button button-secondary" href="/api/system/health">
          Health JSON
        </Link>
        <Link className="button button-secondary" href="/api/system/manifest">
          Manifest JSON
        </Link>
        <Link className="button button-secondary" href="/api/system/capabilities">
          Capabilities JSON
        </Link>
        <Link className="button button-primary" href="/api/system/integration-contract">
          Integration Contract
        </Link>
      </div>

      <pre className="card" aria-label="Raw health response">
        {JSON.stringify(health, null, 2)}
      </pre>
    </section>
  );
}
