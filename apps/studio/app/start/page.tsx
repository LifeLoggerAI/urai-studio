import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Start a Project | URAI Studio',
  description: 'Start a URAI Studio project for cinematic AI campaigns, launch films, music visuals, product visuals, social content systems, and brand worlds.',
  alternates: { canonical: '/start' },
};

export default function StartPage() {
  return (
    <section data-urai-studio-page="start" className="page-stack narrow-page">
      <p className="eyebrow">Start</p>
      <h1>Start with the project path that fits.</h1>
      <p className="hero-lede">URAI Studio is for commercial creative production: campaigns, launch films, product visuals, music visuals, short-form systems, and custom brand worlds.</p>
      <div className="grid three">
        <article className="card elevated"><p className="eyebrow">Fastest</p><h2>Campaign Sprint</h2><p>A focused creative sprint for a launch, product, artist, or founder story.</p><Link className="button button-primary" href="/contact">Start a Project</Link></article>
        <article className="card elevated"><p className="eyebrow">System</p><h2>Content Engine</h2><p>A repeatable production system for short-form, launch, and social content.</p><Link className="button button-secondary" href="/services">View Services</Link></article>
        <article className="card elevated"><p className="eyebrow">Custom</p><h2>Brand World</h2><p>A larger creative world with characters, visual identity, scenes, and reusable assets.</p><Link className="button button-secondary" href="/packages">View Packages</Link></article>
      </div>
    </section>
  );
}
