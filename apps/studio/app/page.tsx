import type { Metadata } from 'next';
import Link from 'next/link';

import { CinematicHero } from '@/components/site/CinematicHero';
import { SystemOfSystemsMap } from '@/components/site/SystemOfSystemsMap';
import { studioModules } from '@/lib/studio/modules';
import { proofPoints } from '@/lib/studio/system-of-systems';

export const metadata: Metadata = {
  title: 'URAI Studio',
  description:
    'The cinematic operating system for memory, media, spatial intelligence, symbolic visuals, motion, and URAI system-of-systems workflows.',
  alternates: {
    canonical: '/',
  },
};

const pathways = [
  {
    title: 'Creator Scroll',
    eyebrow: 'Creators',
    body: 'Turn a project, memory world, brand story, or symbolic idea into a cinematic scroll with scripts, assets, and export-ready structure.',
    href: '/contact',
    cta: 'Start a Project',
  },
  {
    title: 'Studio System',
    eyebrow: 'Teams',
    body: 'Build repeatable production workflows across motion, cinema, visuals, music, asset generation, and launch operations.',
    href: '/studio',
    cta: 'Open Studio',
  },
  {
    title: 'Enterprise Intelligence',
    eyebrow: 'Partners',
    body: 'Connect URAI Studio to private workflows, system contracts, admin diagnostics, data governance, and future licensing layers.',
    href: '/contact',
    cta: 'Contact URAI Labs',
  },
];

const exportFormats = [
  'Scroll JSON',
  'Storyboard markdown',
  'SRT subtitles',
  'Script text',
  'Asset manifest',
  'CapCut-ready scene list',
];

export default function Home() {
  const featuredModules = studioModules
    .filter((module) => module.enabled && module.surfaceCategory !== 'operations')
    .slice(0, 8);

  return (
    <section data-urai-studio-page="home" className="landing-page">
      <CinematicHero />

      <section className="proof-panel" aria-label="URAI Studio production proof">
        {proofPoints.map((point) => (
          <article className="card proof-card" key={point}>
            <p className="eyebrow">Proof</p>
            <h2>{point}</h2>
          </article>
        ))}
      </section>

      <SystemOfSystemsMap compact />

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Studio modules</p>
          <h2>One studio spine for the URAI creative ecosystem.</h2>
          <p>
            URAI Studio is the professional creative layer for Asset Factory, Spatial, Motion, Cinema,
            Music, Visuals, Analytics, Jobs, and future enterprise API workflows. Public modules are wired
            to real routes with safe diagnostic states for integrations that require credentials.
          </p>
        </div>

        <div className="grid feature-grid">
          {featuredModules.map((module) => (
            <article key={module.id} className="card module-card portal-card">
              <div className="module-card-header">
                <Link href={module.route}>{module.name}</Link>
                <span className={`badge badge-${module.status}`}>{module.status}</span>
              </div>
              <p>{module.description}</p>
              <div className="mini-meta">
                <strong>Inputs</strong>
                <span>{module.inputs.join(' · ')}</span>
                <strong>Outputs</strong>
                <span>{module.outputs.join(' · ')}</span>
              </div>
              <Link href={module.route} className="text-link">
                Open {module.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Export center</p>
          <h2>From signal to shareable cinematic package.</h2>
          <p>
            URAI Studio is designed to prepare production artifacts for downstream publishing, editing,
            spatial review, and investor-ready demos.
          </p>
        </div>
        <div className="grid three">
          {exportFormats.map((format) => (
            <article className="card" key={format}>
              <p className="eyebrow">Export format</p>
              <h3>{format}</h3>
              <p>Included in the Studio export manifest contract when the export job is processed.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Creator pathways</p>
          <h2>Choose the layer you want URAI Studio to build.</h2>
        </div>
        <div className="grid three">
          {pathways.map((pathway) => (
            <article className="card elevated" key={pathway.title}>
              <p className="eyebrow">{pathway.eyebrow}</p>
              <h2>{pathway.title}</h2>
              <p>{pathway.body}</p>
              <Link className="button button-secondary" href={pathway.href}>{pathway.cta}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="launch-panel trust-band">
        <div>
          <p className="eyebrow">Privacy-first creative infrastructure</p>
          <h2>Consent is the operating layer.</h2>
          <p>
            URAI Studio keeps public pages polished and confident while operator-level diagnostics, Firebase errors,
            and callable payloads stay inside admin surfaces.
          </p>
        </div>
        <div className="cta-row">
          <Link className="button button-secondary" href="/privacy">Read Privacy</Link>
          <Link className="button button-primary" href="/contact">Start a Project</Link>
        </div>
      </section>
    </section>
  );
}
