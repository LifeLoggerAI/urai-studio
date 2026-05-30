import type { Metadata } from 'next';
import Link from 'next/link';

import { CinematicHero } from '@/components/site/CinematicHero';
import { MagicalHomeExperience } from '@/components/site/MagicalHomeExperience';
import { SystemOfSystemsMap } from '@/components/site/SystemOfSystemsMap';
import { studioModules } from '@/lib/studio/modules';
import { proofPoints } from '@/lib/studio/system-of-systems';

export const metadata: Metadata = {
  title: 'URAI Studio | AI campaigns built to stop the scroll',
  description:
    'URAI Studio builds cinematic AI campaigns, launch films, music visuals, product visuals, social content systems, and brand worlds for creators, founders, and teams.',
  alternates: {
    canonical: '/',
  },
};

const pathways = [
  {
    title: 'Campaign Sprint',
    eyebrow: 'Brands and founders',
    body: 'Turn a product, launch, artist story, or brand world into a cinematic AI campaign with scripts, assets, scenes, and platform-ready structure.',
    href: '/contact',
    cta: 'Start a Project',
  },
  {
    title: 'Content System',
    eyebrow: 'Creators and teams',
    body: 'Build a repeatable content engine across motion, cinema, visuals, music, asset generation, storyboards, and launch operations.',
    href: '/studio',
    cta: 'Explore Studio System',
  },
  {
    title: 'Custom Brand World',
    eyebrow: 'Partners',
    body: 'Scope a larger creative system for campaigns, characters, visual identity, production workflows, and private collaboration paths after review.',
    href: '/contact',
    cta: 'Contact URAI Studio',
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

      <MagicalHomeExperience />

      <SystemOfSystemsMap compact />

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Studio modules</p>
          <h2>One studio spine for cinematic AI production.</h2>
          <p>
            URAI Studio is the commercial creative layer for campaigns, launch films, motion, cinema,
            music, visuals, social assets, brand worlds, and production-ready exports. Public modules
            stay client-facing; private diagnostics and operator tools stay out of the sales surface.
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
          <h2>From idea to shareable cinematic package.</h2>
          <p>
            URAI Studio prepares campaign artifacts for editing, publishing, review, and handoff without
            turning internal pipeline status into public launch claims.
          </p>
        </div>
        <div className="grid three">
          {exportFormats.map((format) => (
            <article className="card" key={format}>
              <p className="eyebrow">Export format</p>
              <h3>{format}</h3>
              <p>Included in the Studio export manifest when the project scope includes that deliverable.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Creator pathways</p>
          <h2>Choose the creative layer you want URAI Studio to build.</h2>
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
          <p className="eyebrow">Privacy-aware creative infrastructure</p>
          <h2>Polished public work. Protected private operations.</h2>
          <p>
            URAI Studio keeps client-facing pages clear and confident while operator diagnostics,
            internal payloads, credentials, and private project details stay inside protected surfaces.
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
