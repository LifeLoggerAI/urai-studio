import Link from 'next/link';

import { HeroVisual } from '@/components/site/HeroVisual';
import { studioModules } from '@/lib/studio/modules';

const quickLinks = [
  { label: 'Start a Project', href: '/contact', tone: 'primary' },
  { label: 'Join Waitlist', href: '/waitlist', tone: 'secondary' },
  { label: 'View Demo', href: '/demo', tone: 'secondary' },
  { label: 'Explore Systems', href: '/systems', tone: 'secondary' },
];

const pillars = [
  {
    title: 'Cinematic AI production',
    body: 'Design, motion, video, voice, and symbolic visual systems built as one premium creative pipeline.',
  },
  {
    title: 'URAI ecosystem native',
    body: 'Studio surfaces connect to the wider URAI stack for memory maps, spatial storytelling, privacy, admin, and analytics.',
  },
  {
    title: 'Launch-grade infrastructure',
    body: 'Every public path is designed for real users: clear CTAs, safe fallbacks, SEO, contact capture, and deployable defaults.',
  },
];

const proofPoints = [
  'Cinematic AI-native interfaces',
  'Privacy-first creative infrastructure',
  'Production systems for motion, spatial, visual, and narrative workflows',
];

export default function Home() {
  const featuredModules = studioModules
    .filter((module) => module.enabled && module.surfaceCategory !== 'operations')
    .slice(0, 8);

  return (
    <section className="landing-page" data-urai-studio-page="home">
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

      <div className="grid three">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="card elevated">
            <h2>{pillar.title}</h2>
            <p>{pillar.body}</p>
          </article>
        ))}
      </div>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Studio modules</p>
          <h2>One studio spine for the URAI creative ecosystem.</h2>
          <p>
            Public modules are wired to real routes with safe diagnostic states for integrations that require
            credentials.
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
              <Link href={module.route} className="text-link">
                Open {module.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="launch-panel">
        <div>
          <p className="eyebrow">www.uraistudio.com</p>
          <h2>Built for a polished public launch at www.uraistudio.com.</h2>
          <p>
            Navigation, metadata, sitemap, robots, deployment environment documentation, and conversion CTAs are
            aligned around a production website foundation.
          </p>
        </div>
        <Link className="button button-primary" href="/contact">
          Discuss a Build
        </Link>
      </section>
    </section>
  );
}