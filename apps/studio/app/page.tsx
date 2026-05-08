import type { Metadata } from 'next';
import Link from 'next/link';

import { HeroVisual } from '@/components/site/HeroVisual';
import { studioModules } from '@/lib/studio/modules';

export const metadata: Metadata = {
  title: 'URAI Studio',
  description:
    'Premium cinematic AI creative infrastructure for generated media, motion, spatial storytelling, and URAI system-of-systems workflows.',
  alternates: {
    canonical: '/',
  },
};

const quickLinks = [
  { label: 'Explore Studio', href: '/studio', tone: 'primary' },
  { label: 'Start Generating', href: '/generate', tone: 'secondary' },
  { label: 'View System', href: '/system', tone: 'secondary' },
  { label: 'Start a Project', href: '/contact', tone: 'secondary' },
];

const proofPoints = [
  'Cinematic AI-native interfaces',
  'Privacy-first creative infrastructure',
  'Production systems for motion, spatial, visual, and narrative workflows',
];

export default function Home() {
  const featuredModules = studioModules.slice(0, 8);

  return (
    <section data-urai-studio-page="home" className="landing-page">
      <div className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">URAI Studio · Cinematic AI systems</p>
          <h1>Premium creative infrastructure for memory, media, and spatial intelligence.</h1>
          <p className="hero-lede">
            URAI Studio turns signals into story: production-grade tools for cinematic interfaces,
            symbolic visual systems, spatial experiences, motion pipelines, and AI-native creative operations.
          </p>

          <div className="cta-row" aria-label="Primary calls to action">
            {quickLinks.map(({ label, href, tone }) => (
              <Link className={`button button-${tone}`} key={href} href={href}>
                {label}
              </Link>
            ))}
          </div>

          <div className="proof-strip" aria-label="Studio strengths">
            {proofPoints.map((point) => (
              <span key={point}>{point}</span>
            ))}
          </div>
        </div>

        <div className="hero-panel" aria-label="URAI Studio visual identity preview">
          <HeroVisual />
          <div className="hero-panel-copy">
            <span>Live studio spine</span>
            <strong>Motion · Cinema · Spatial · Visuals</strong>
          </div>
        </div>
      </div>

      <div className="section-heading">
        <p className="eyebrow">Ecosystem</p>
        <h2>One studio spine for the URAI creative ecosystem.</h2>
        <p>
          URAI Studio is the professional creative layer for Asset Factory, Spatial, Motion, Cinema,
          Music, Visuals, Analytics, Jobs, and future enterprise API workflows.
        </p>
      </div>

      <div className="grid feature-grid">
        {featuredModules.map((module) => (
          <article key={module.id} className="card module-card">
            <div className="module-card-header">
              <Link href={module.route}>{module.name}</Link>
              <span className={`badge badge-${module.status}`}>{module.status}</span>
            </div>
            <p>{module.description}</p>
          </article>
        ))}
      </div>

      <div className="launch-panel">
        <div>
          <p className="eyebrow">Launch path</p>
          <h2>Built for a polished public launch at www.uraistudio.com.</h2>
          <p>
            Navigation, metadata, sitemap, robots, deployment environment documentation, and conversion CTAs
            are aligned around a production website foundation.
          </p>
        </div>
        <Link className="button button-primary" href="/contact">
          Discuss a Build
        </Link>
      </div>
    </section>
  );
}
