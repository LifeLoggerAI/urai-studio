import type { Metadata } from 'next';
import Link from 'next/link';

import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Start a Project | URAI Studio',
  description:
    'Contact URAI Studio for cinematic AI campaigns, launch films, music visuals, product visuals, social content systems, and brand worlds.',
  alternates: {
    canonical: '/contact',
  },
};

const contactPaths = [
  'Cinematic AI campaign or launch film',
  'Short-form social content system',
  'Music visual, product visual, or trailer',
  'Custom brand world, character, or visual identity package',
];

export default function ContactPage() {
  return (
    <section data-urai-studio-page="contact" className="page-stack narrow-page">
      <p className="eyebrow">Project intake</p>
      <h1>Start a URAI Studio project.</h1>
      <p className="hero-lede">
        Use this page for Studio work: campaigns, launch films, music visuals, product visuals,
        social content systems, custom brand worlds, and production-ready creative packages.
      </p>

      <div className="grid feature-grid">
        <div className="page-stack stack-lg">
          <article className="card">
            <h2>Best for</h2>
            <ul>
              {contactPaths.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
          </article>

          <article className="card">
            <h2>Before production starts</h2>
            <p>
              Scope, usage rights, assets, timeline, budget, and approval flow should be clear before
              URAI Studio begins production. Internal diagnostics, credentials, and private project details
              stay out of the public sales surface.
            </p>
            <Link className="button button-secondary" href="/privacy">
              Review Privacy
            </Link>
          </article>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
