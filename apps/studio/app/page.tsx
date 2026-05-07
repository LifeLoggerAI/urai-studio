import Link from 'next/link';

import { HeroVisual } from '@/components/site/HeroVisual';
import { studioModules } from '@/lib/studio/modules';

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

const quickLinks = [
  ['Start a Project', '/contact'],
  ['Join Waitlist', '/waitlist'],
  ['View Demo', '/demo'],
  ['Explore Systems', '/systems'],
];

export default function Home() {
  const publicModules = studioModules.filter((module) => module.enabled && module.surfaceCategory !== 'operations').slice(0, 8);

  return (
    <section className="stack-xl">
      <div className="hero-grid">
        <div className="stack-lg">
          <p className="eyebrow">AI-native creative infrastructure</p>
          <h1>Cinematic systems for media, memory, spatial storytelling, and intelligent creative operations.</h1>
          <p className="lede">
            URAI Studio is the premium production surface for the URAI ecosystem: a creative lab for symbolic visuals,
            motion, cinema, music, spatial interfaces, and launch-ready AI experiences.
          </p>
          <div className="button-row" aria-label="Primary calls to action">
            {quickLinks.map(([label, href], index) => (
              <Link className={index === 0 ? 'button button-primary' : 'button'} key={href} href={href}>
                {label}
              </Link>
            ))}
          </div>
        </div>
        <HeroVisual />
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
          <h2>One studio lattice for every creative surface.</h2>
          <p>
            Public modules are wired to real routes with safe diagnostic states for integrations that require credentials.
          </p>
        </div>
        <div className="grid">
          {publicModules.map((module) => (
            <article key={module.id} className="card module-card">
              <div>
                <p className="eyebrow">{module.owner}</p>
                <h3>{module.name}</h3>
                <p>{module.description}</p>
              </div>
              <Link href={module.route} className="text-link">
                Open {module.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <p className="eyebrow">www.uraistudio.com</p>
          <h2>Ready for a cinematic AI studio presence.</h2>
          <p>Use the contact flow for project requests or the waitlist for early access updates.</p>
        </div>
        <Link className="button button-primary" href="/contact">
          Contact URAI Studio
        </Link>
      </section>
    </section>
  );
}
