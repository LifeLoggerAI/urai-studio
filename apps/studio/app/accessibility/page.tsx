import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'Review URAI Studio accessibility commitments for keyboard access, focus, text scaling, reduced motion, and assistive technology.',
  alternates: { canonical: '/accessibility' },
};

export default function AccessibilityPage() {
  return (
    <section data-urai-studio-page="accessibility" className="page-stack prose-page">
      <p className="eyebrow">Accessibility</p>
      <h1>Creative work should remain accessible across input, vision, motion, and assistive-technology needs.</h1>
      <p className="hero-lede">
        URAI Studio public pages are designed to support keyboard navigation, visible focus, browser text scaling,
        reduced-motion preferences, responsive reflow, and semantic page structure.
      </p>
      <div className="grid feature-grid">
        <article className="card"><h2>Keyboard and focus</h2><p>Primary navigation, links, forms, and controls should be usable without a pointer and expose a visible focus state.</p></article>
        <article className="card"><h2>Motion and display</h2><p>The Studio shell honors reduced-motion preferences and preserves browser zoom and text scaling rather than requiring animation to understand content.</p></article>
        <article className="card"><h2>Report a barrier</h2><p>Email <a href="mailto:accessibility@urailabs.com">accessibility@urailabs.com</a> with the affected page and task. Do not send passwords, API keys, or private project assets.</p></article>
      </div>
    </section>
  );
}
