import type { Metadata } from 'next';
import Link from 'next/link';

import { CinematicHero } from '@/components/site/CinematicHero';
import { MagicalHomeExperience } from '@/components/site/MagicalHomeExperience';
import { studioModules } from '@/lib/studio/modules';

export const metadata: Metadata = {
  title: 'URAI Studio — Cinematic creative systems',
  description:
    'URAI Studio creates launch films, motion, music visuals, product imagery, social campaigns, and immersive brand worlds for creators, founders, and teams.',
  alternates: {
    canonical: '/',
  },
};

const pathways = [
  {
    title: 'Launch a campaign',
    eyebrow: 'For brands and founders',
    body: 'Shape one idea into a coherent campaign across film, motion, imagery, social, and launch-ready creative.',
    href: '/contact',
    cta: 'Start a project',
  },
  {
    title: 'Build a content system',
    eyebrow: 'For creators and teams',
    body: 'Create a repeatable visual language and production rhythm that can move across channels without losing its identity.',
    href: '/studio',
    cta: 'Explore the studio',
  },
  {
    title: 'Create a brand world',
    eyebrow: 'For ambitious projects',
    body: 'Develop a larger cinematic world spanning identity, characters, environments, campaigns, and interactive experiences.',
    href: '/contact',
    cta: 'Talk with URAI Studio',
  },
];

const publicCreativeWorldIds = new Set(['motion', 'cinema', 'music', 'visuals']);

const capabilityCopy: Record<string, { title: string; body: string }> = {
  motion: {
    title: 'Motion',
    body: 'Authored movement, title systems, transitions, and visual rhythm designed as one language.',
  },
  cinema: {
    title: 'Cinema',
    body: 'Launch films and narrative sequences built around pacing, atmosphere, sound, and a clear emotional arc.',
  },
  music: {
    title: 'Music',
    body: 'Visual systems for artists, releases, performances, and music-led campaigns.',
  },
  visuals: {
    title: 'Visuals',
    body: 'Product imagery, key art, environments, and campaign frames with a consistent art direction.',
  },
};

export default function Home() {
  const featuredModules = studioModules
    .filter((module) => module.enabled && publicCreativeWorldIds.has(module.id) && capabilityCopy[module.id])
    .map((module) => ({ ...module, ...capabilityCopy[module.id] }));

  return (
    <section data-urai-studio-page="home" className="landing-page">
      <CinematicHero />

      <MagicalHomeExperience />

      <section className="section-panel studio-capabilities" aria-labelledby="studio-capabilities-title">
        <div className="section-heading">
          <p className="eyebrow">What we make</p>
          <h2 id="studio-capabilities-title">One creative language, carried across every format.</h2>
          <p>
            Cinema, motion, music, and visuals are art-directed together so the finished campaign feels
            intentional from its first frame to its last touchpoint.
          </p>
        </div>

        <div className="grid feature-grid">
          {featuredModules.map((module) => (
            <article key={module.id} className="card module-card portal-card">
              <h3>{module.title}</h3>
              <p>{module.body}</p>
              <Link href={module.route} className="text-link" aria-label={`Explore ${module.title}`}>
                Explore {module.title}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel" aria-labelledby="studio-pathways-title">
        <div className="section-heading">
          <p className="eyebrow">Ways to work together</p>
          <h2 id="studio-pathways-title">Start with the outcome, not the production stack.</h2>
          <p>
            Bring a launch, story, product, artist, or world. URAI Studio shapes the creative system around
            what the work needs to become.
          </p>
        </div>
        <div className="grid three">
          {pathways.map((pathway) => (
            <article className="card elevated" key={pathway.title}>
              <p className="eyebrow">{pathway.eyebrow}</p>
              <h3>{pathway.title}</h3>
              <p>{pathway.body}</p>
              <Link className="button button-secondary" href={pathway.href}>{pathway.cta}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="launch-panel trust-band" aria-labelledby="studio-trust-title">
        <div>
          <p className="eyebrow">Private by design</p>
          <h2 id="studio-trust-title">Your work stays yours while it is being made.</h2>
          <p>
            Project material, collaboration details, and private creative work stay behind the appropriate
            controls. Public pages show finished work and capabilities—not internal project data.
          </p>
        </div>
        <div className="cta-row">
          <Link className="button button-secondary" href="/privacy">Privacy</Link>
          <Link className="button button-primary" href="/contact">Start a project</Link>
        </div>
      </section>
    </section>
  );
}
