import type { Metadata } from 'next';
import Link from 'next/link';

import { SystemOfSystemsMap } from '@/components/site/SystemOfSystemsMap';

export const metadata: Metadata = {
  title: 'System of Systems',
  description: 'URAI Studio system map for connected creative, spatial, analytics, admin, privacy, foundation, and enterprise workflows.',
  alternates: {
    canonical: '/systems',
  },
};

export default function SystemsPage() {
  return (
    <section data-urai-studio-page="systems" className="page-stack">
      <span data-urai-studio-page="system" hidden />
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
          API Contract
        </Link>
        <Link className="button button-secondary" href="/api/system/capabilities">
          Capabilities
        </Link>
        <Link className="button button-secondary" href="/status">
          Status
        </Link>
      </div>

      <SystemOfSystemsMap />
    </section>
  );
}
