import type { Metadata } from 'next';
import Link from 'next/link';

import { SystemCard } from '@/components/site/SystemCard';
import { StudioActionPanel } from '@/components/studio/StudioActionPanel';
import { studioModules } from '@/lib/studio/modules';
import { systems } from '@/lib/studio/systems';

export const metadata: Metadata = {
  title: 'Studio Overview',
  description:
    'URAI Studio dashboard overview for cinematic creative modules, module status, generation intake, jobs, assets, and system diagnostics.',
  alternates: {
    canonical: '/studio',
  },
};

export default function StudioPage() {
  const studioSystems = systems.filter((system) =>
    ['studio', 'motion', 'cinema', 'music', 'visuals', 'spatial'].includes(system.slug),
  );
  const configuredModules = studioModules.filter((module) => module.enabled && module.status !== 'disconnected');

  return (
    <section data-urai-studio-page="studio" className="page-stack">
      <p className="eyebrow">Studio command center</p>
      <h1>URAI Studio</h1>
      <p className="hero-lede">
        A production-safe overview of the cinematic creative arm of URAI: memory, media,
        motion, generated assets, spatial storytelling systems, and honest integration status.
      </p>

      <div className="grid">
        <article className="card">
          <p className="eyebrow">Configured modules</p>
          <h2>{configuredModules.length}</h2>
          <p>Enabled modules that are available through the Studio registry without a disconnected status.</p>
        </article>
        <article className="card">
          <p className="eyebrow">Generation</p>
          <h2>Feature-gated</h2>
          <p>Live generation is enabled only when endpoint and API key environment variables are configured.</p>
        </article>
        <article className="card">
          <p className="eyebrow">Diagnostics</p>
          <h2>Contract-first</h2>
          <p>Health, manifest, capabilities, OpenAPI, and integration contract APIs expose production state.</p>
        </article>
      </div>

      <div className="cta-row" aria-label="Studio workflow links">
        <Link className="button button-primary" href="/generate">
          Start Intake
        </Link>
        <Link className="button button-secondary" href="/studio/video-factory">
          Video Factory
        </Link>
        <Link className="button button-secondary" href="/studio/projects">
          Studio Projects
        </Link>
        <Link className="button button-secondary" href="/studio/assets">
          Studio Assets
        </Link>
        <Link className="button button-secondary" href="/studio/exports">
          Studio Exports
        </Link>
        <Link className="button button-secondary" href="/studio/admin">
          Studio Admin
        </Link>
      </div>

      <StudioActionPanel />

      <div className="section-heading">
        <p className="eyebrow">Creative systems</p>
        <h2>Module surfaces</h2>
        <p>Each surface is represented honestly: wired systems show their integration posture, while unavailable backends remain feature-gated.</p>
      </div>

      <div className="grid">
        {studioSystems.map((system) => (
          <SystemCard key={system.id} s={system} />
        ))}
      </div>
    </section>
  );
}
