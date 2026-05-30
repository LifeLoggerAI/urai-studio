import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Services | URAI Studio',
  description: 'URAI Studio services for AI campaign films, launch assets, music visuals, product visuals, social content systems, and brand worlds.',
  alternates: { canonical: '/services' },
};

const services = [
  ['Campaign films', 'Cinematic campaign videos and visual packages for launches, products, artists, and brands.'],
  ['Short-form content', 'Scripts, scenes, captions, and export packages for platform-ready social content.'],
  ['Music visuals', 'Visual scenes, loops, covers, and cinematic moments for artist releases.'],
  ['Product visuals', 'Product scenes, explainers, launch reels, feature clips, and brand visuals.'],
  ['Brand worlds', 'Reusable visual identity systems, environments, motifs, and campaign language.'],
  ['Character campaigns', 'Character-led concepts, scenes, story beats, and asset manifests.'],
];

export default function ServicesPage() {
  return (
    <section data-urai-studio-page="services" className="page-stack narrow-page">
      <p className="eyebrow">Services</p>
      <h1>AI creative services, built as production systems.</h1>
      <p className="hero-lede">URAI Studio turns project ideas into cinematic assets, structured exports, and reusable creative systems.</p>
      <div className="grid three">
        {services.map(([title, body]) => (
          <article className="card" key={title}><h2>{title}</h2><p>{body}</p></article>
        ))}
      </div>
      <div className="cta-row"><Link className="button button-primary" href="/contact">Start a Project</Link><Link className="button button-secondary" href="/packages">View Packages</Link></div>
    </section>
  );
}
