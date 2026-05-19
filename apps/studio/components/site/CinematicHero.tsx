import Link from 'next/link';

import { AuraField } from './AuraField';

const heroProof = [
  'Memory → media',
  'Emotion → scene',
  'Signals → scrolls',
  'Systems → spatial worlds',
];

export function CinematicHero() {
  return (
    <section className="hero-section cinematic-hero" aria-labelledby="home-hero-heading">
      <div className="hero-copy">
        <p className="eyebrow">URAI Studio · Cinematic AI systems</p>
        <h1 id="home-hero-heading">The cinematic operating system for memory, media, and spatial intelligence.</h1>
        <p className="hero-lede">
          URAI Studio turns signals into scenes — transforming passive memory, emotional context, symbolic visuals,
          motion, music, and spatial worlds into production-ready creative systems.
        </p>
        <div className="cta-row" aria-label="Primary calls to action">
          <Link className="button button-primary" href="/contact">Start a Studio Project</Link>
          <Link className="button button-secondary" href="/systems">Explore the URAI System</Link>
          <Link className="button button-secondary" href="/studio">Open the Command Center</Link>
        </div>
        <div className="proof-strip" aria-label="URAI Studio signal pipeline">
          {heroProof.map((point) => <span key={point}>{point}</span>)}
        </div>
      </div>
      <div className="hero-panel cinematic-panel" aria-label="URAI Studio living aura field">
        <AuraField />
        <div className="hero-panel-copy">
          <span>Live studio spine</span>
          <strong>Studio · Asset Factory · Motion · Cinema · Spatial</strong>
        </div>
      </div>
    </section>
  );
}
