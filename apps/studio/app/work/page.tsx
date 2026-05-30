import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Work | URAI Studio',
  description: 'URAI Studio work areas for campaign films, music visuals, product visuals, content systems, and brand worlds.',
  alternates: { canonical: '/work' },
};

const workAreas = [
  ['Campaign film systems', 'Story structure, scene direction, and asset manifests for launch work.'],
  ['Music and motion visuals', 'Visual loops, release scenes, lyric moments, and atmospheric identity.'],
  ['Product and brand scenes', 'Product visuals, brand moments, and reusable campaign environments.'],
];

export default function WorkPage() {
  return (
    <section data-urai-studio-page="work" className="page-stack narrow-page">
      <p className="eyebrow">Work</p>
      <h1>Explore URAI Studio work areas.</h1>
      <p className="hero-lede">This route organizes the kinds of projects URAI Studio can produce. Published examples should be added only when they are approved for public display.</p>
      <div className="grid three">
        {workAreas.map(([title, body]) => (
          <article className="card" key={title}><h2>{title}</h2><p>{body}</p></article>
        ))}
      </div>
      <div className="cta-row"><Link className="button button-primary" href="/contact">Start a Project</Link><Link className="button button-secondary" href="/case-studies">View Case Studies</Link></div>
    </section>
  );
}
