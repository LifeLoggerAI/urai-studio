import type { Metadata } from 'next';
import Link from 'next/link';

import { SystemCard } from '@/components/site/SystemCard';
import { systems } from '@/lib/studio/systems';

export const metadata: Metadata = {
  title: 'System of Systems',
  description:
    'URAI Studio system-of-systems map for connected creative, spatial, analytics, admin, privacy, and enterprise workflows.',
  alternates: {
    canonical: '/system',
  },
};

export default function SystemsPage() {
  return (
    <section data-urai-studio-page="system" className="page-stack">
      <p className="eyebrow">System of systems</p>
      <h1>URAI Studio integration map</h1>
      <p className="hero-lede">
        URAI Studio connects creative production surfaces to shared contracts, status reporting,
        privacy-first controls, operational analytics, and future enterprise APIs.
      </p>

      <div className="cta-row" aria-label="System contract links">
        <Link className="button button-primary" href="/api/system/integration-contract">
          Integration Contract
        </Link>
        <Link className="button button-secondary" href="/api/system/openapi">
          OpenAPI
        </Link>
        <Link className="button button-secondary" href="/api/system/capabilities">
          Capabilities
        </Link>
        <Link className="button button-secondary" href="/status">
          Status
        </Link>
      </div>

      <div className="grid">
        {systems.map((system) => (
          <SystemCard key={system.id} s={system} />
        ))}
      </div>
    </section>
  );
}
