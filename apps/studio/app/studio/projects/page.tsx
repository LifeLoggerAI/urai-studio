import type { Metadata } from 'next';
import Link from 'next/link';

import { StudioActionPanel } from '@/components/studio/StudioActionPanel';

export const metadata: Metadata = {
  title: 'Studio Projects',
  description: 'Create, seed, and verify URAI Studio projects backed by Firebase callable functions.',
  alternates: { canonical: '/studio/projects' },
};

const projectFlow = [
  'Create or seed a Studio project.',
  'Attach scenes, assets, narration, and scroll records.',
  'Generate scripts and export manifests through callable functions.',
  'Verify results in Firestore and the export center.',
];

export default function StudioProjectsPage() {
  return (
    <section data-urai-studio-page="studio-projects" className="page-stack">
      <p className="eyebrow">Studio projects</p>
      <h1>Project system</h1>
      <p className="hero-lede">
        The Studio project layer groups cinematic scenes, generated assets, narrator scripts, scrolls, and export jobs into one coherent workflow.
      </p>

      <div className="grid">
        {projectFlow.map((item, index) => (
          <article className="card" key={item}>
            <p className="eyebrow">Step {index + 1}</p>
            <h2>{item}</h2>
          </article>
        ))}
      </div>

      <StudioActionPanel />

      <div className="cta-row">
        <Link className="button button-secondary" href="/studio/assets">Open assets</Link>
        <Link className="button button-secondary" href="/studio/exports">Open exports</Link>
        <Link className="button button-secondary" href="/studio/admin">Open admin QA</Link>
      </div>
    </section>
  );
}
