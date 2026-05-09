import type { Metadata } from 'next';
import Link from 'next/link';

import { StudioActionPanel } from '@/components/studio/StudioActionPanel';

export const metadata: Metadata = {
  title: 'Studio Exports',
  description: 'URAI Studio export center for manifests, scroll JSON, storyboard markdown, SRT, and CapCut-ready scene lists.',
  alternates: { canonical: '/studio/exports' },
};

const exportFormats = [
  'scroll JSON',
  'storyboard markdown',
  'SRT subtitles',
  'script text',
  'asset manifest',
  'CapCut-ready scene list',
];

export default function StudioExportsPage() {
  return (
    <section data-urai-studio-page="studio-exports" className="page-stack">
      <p className="eyebrow">Export Center</p>
      <h1>Studio exports</h1>
      <p className="hero-lede">
        Create export jobs, process them into manifests, and prepare shareable URAI Studio packages for downstream publishing.
      </p>

      <div className="grid three">
        {exportFormats.map((format) => (
          <article className="card" key={format}>
            <p className="eyebrow">Export format</p>
            <h2>{format}</h2>
            <p>Included in the Studio export manifest contract when the export job is processed.</p>
          </article>
        ))}
      </div>

      <StudioActionPanel />

      <div className="cta-row">
        <Link className="button button-secondary" href="/studio/projects">Open projects</Link>
        <Link className="button button-secondary" href="/studio/assets">Open assets</Link>
      </div>
    </section>
  );
}
