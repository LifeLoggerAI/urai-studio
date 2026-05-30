import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Packages | URAI Studio',
  description: 'URAI Studio package paths for campaign sprints, launch content, brand worlds, and monthly creative systems.',
  alternates: { canonical: '/packages' },
};

const packages = [
  ['Starter Sprint', 'A focused package for one clear creative output, launch clip, or proof-of-concept scene.'],
  ['Growth Sprint', 'A larger content batch with multiple scenes, social cuts, captions, and handoff assets.'],
  ['Launch Campaign', 'A structured campaign package for a product, artist, creator, founder, or brand launch.'],
  ['Monthly Retainer', 'An ongoing creative system for recurring short-form assets, visuals, and campaign iterations.'],
  ['Custom Brand World', 'A custom visual universe with motifs, characters, scenes, and reusable creative language.'],
];

export default function PackagesPage() {
  return (
    <section data-urai-studio-page="packages" className="page-stack narrow-page">
      <p className="eyebrow">Packages</p>
      <h1>Choose a Studio package path.</h1>
      <p className="hero-lede">Packages are scoped after review. Public labels describe direction, not guaranteed deliverables or outcomes.</p>
      <div className="grid three">
        {packages.map(([title, body]) => (
          <article className="card elevated" key={title}>
            <p className="eyebrow">Studio package</p>
            <h2>{title}</h2>
            <p>{body}</p>
            <Link className="button button-secondary" href="/contact">Discuss package</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
