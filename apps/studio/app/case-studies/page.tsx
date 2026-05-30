import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Case Studies | URAI Studio',
  description: 'URAI Studio case-study route for approved project summaries, creative process notes, and production-safe outcomes.',
  alternates: { canonical: '/case-studies' },
};

const caseStudySlots = [
  ['Launch story', 'A structured summary for launch films, campaign assets, and creative direction.'],
  ['Artist visual', 'A structured summary for music visuals, motion scenes, and release assets.'],
  ['Brand world', 'A structured summary for reusable visual identity, scenes, and content systems.'],
];

export default function CaseStudiesPage() {
  return (
    <section data-urai-studio-page="case-studies" className="page-stack narrow-page">
      <p className="eyebrow">Case Studies</p>
      <h1>Case studies belong here once approved.</h1>
      <p className="hero-lede">Use this route for approved project summaries. Keep public examples clear, permissioned, and scoped to what can be shown.</p>
      <div className="grid three">
        {caseStudySlots.map(([title, body]) => (
          <article className="card" key={title}><h2>{title}</h2><p>{body}</p></article>
        ))}
      </div>
      <div className="cta-row"><Link className="button button-primary" href="/contact">Start a Project</Link><Link className="button button-secondary" href="/work">View Work Areas</Link></div>
    </section>
  );
}
