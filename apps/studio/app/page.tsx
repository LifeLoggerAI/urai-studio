import type { Metadata } from 'next';
import Link from 'next/link';

import { MagicalHomeExperience } from '@/components/site/MagicalHomeExperience';
import { studioModules } from '@/lib/studio/modules';

export const metadata: Metadata = {
  title: 'URAI Studio — Compose experiences across the URAI system',
  description:
    'Bring content, assets, spatial worlds, durable jobs, analytics, and review into one creative command environment.',
  alternates: { canonical: '/' },
};

const publicCreativeWorldIds = new Set(['motion', 'cinema', 'music', 'visuals']);

const capabilityCopy: Record<string, { title: string; body: string }> = {
  motion: { title: 'Motion', body: 'Authored movement, title systems, transitions, and visual rhythm designed as one language.' },
  cinema: { title: 'Cinema', body: 'Narrative sequences built around pacing, atmosphere, sound, and a clear emotional arc.' },
  music: { title: 'Music', body: 'Visual systems for artists, releases, performances, and music-led experiences.' },
  visuals: { title: 'Visuals', body: 'Product imagery, key art, environments, and campaign frames with a consistent art direction.' },
};

const compositionSteps = [
  ['INTENT', 'Studio', 'Define the outcome, creative direction, constraints, review path, and project structure.'],
  ['CANON', 'Content', 'Pull approved language and structured content instead of copying truth into another silo.'],
  ['MATERIAL', 'Asset Factory', 'Request governed images, 3D, audio, or bundles with provenance when the work needs them.'],
  ['EXECUTION', 'Jobs Runtime', 'Move long-running generation and rendering into durable, inspectable work.'],
  ['WORLD', 'Spatial', 'Preview or place approved material inside a spatial experience when that form adds meaning.'],
  ['EVIDENCE', 'Analytics', 'Review authorized outcome evidence without turning creative work into fake performance theater.'],
] as const;

const pathways = [
  {
    title: 'Compose a launch',
    eyebrow: 'Objective',
    body: 'Bring product truth, imagery, motion, sound, spatial material, approvals, and release evidence into one coherent creative path.',
    href: '/contact',
    cta: 'Start a project',
  },
  {
    title: 'Build a reusable world',
    eyebrow: 'Objective',
    body: 'Create a visual and narrative system that can move across film, motion, imagery, web, and spatial experiences without losing identity.',
    href: '/studio',
    cta: 'Open the studio',
  },
  {
    title: 'Review before release',
    eyebrow: 'Objective',
    body: 'Keep versions, provenance, approvals, private material, and final exports attached to the project that produced them.',
    href: '/privacy',
    cta: 'Review privacy boundary',
  },
];

export default function Home() {
  const featuredModules = studioModules
    .filter((module) => module.enabled && publicCreativeWorldIds.has(module.id) && capabilityCopy[module.id])
    .map((module) => ({ ...module, ...capabilityCopy[module.id] }));

  return (
    <section data-urai-studio-page="home" className="landing-page">
      <section className="section-panel" aria-labelledby="studio-home-title">
        <div className="section-heading">
          <p className="eyebrow">URAI Studio · Compose</p>
          <h1 id="studio-home-title">Compose experiences from the systems already inside URAI.</h1>
          <p>
            Bring content, assets, spatial worlds, durable jobs, analytics, and review into one creative command environment.
          </p>
          <div className="cta-row">
            <Link className="button button-primary" href="/studio">Open the studio</Link>
            <Link className="button button-secondary" href="/contact">Start a project</Link>
          </div>
        </div>
      </section>

      <MagicalHomeExperience />

      <section className="section-panel" aria-labelledby="composition-title">
        <div className="section-heading">
          <p className="eyebrow">System composition</p>
          <h2 id="composition-title">The creative interface hides the plumbing without hiding the authority.</h2>
          <p>
            Studio invokes bounded capabilities when a project needs them. The person stays inside the creative workflow; the system keeps content authority, asset provenance, durable execution, spatial previews, and evidence attached to their real owners.
          </p>
        </div>
        <div className="grid three">
          {compositionSteps.map(([verb, system, body]) => (
            <article className="card elevated" key={verb}>
              <p className="eyebrow">{verb}</p>
              <h3>{system}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel studio-capabilities" aria-labelledby="studio-capabilities-title">
        <div className="section-heading">
          <p className="eyebrow">Creative worlds</p>
          <h2 id="studio-capabilities-title">One creative language, expressed through different media.</h2>
          <p>
            Cinema, motion, music, and visuals stay distinct enough to do their jobs and connected enough to belong to one project.
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
          <p className="eyebrow">Objective first</p>
          <h2 id="studio-pathways-title">Start with what the work needs to become.</h2>
          <p>The project determines which URAI capabilities become active; there is no fixed microservice-shaped workflow exposed to the creator.</p>
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
          <h2 id="studio-trust-title">Private work stays behind the appropriate boundary.</h2>
          <p>
            Project material, private media, collaboration details, generation inputs, review notes, and unreleased exports remain gated. Public Studio surfaces explain capability and show approved work—not internal project data.
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
