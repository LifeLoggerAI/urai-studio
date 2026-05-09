import type { Metadata } from 'next';
import Link from 'next/link';

import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact URAI Labs about URAI Studio production builds, generated media workflows, enterprise integration, and launch support.',
  alternates: {
    canonical: '/contact',
  },
};

const contactPaths = [
  'Production website and launch readiness',
  'Generated media and Asset Factory workflows',
  'Spatial, motion, cinema, music, and visual systems',
  'Enterprise API, admin, analytics, and privacy integration',
];

export default function ContactPage() {
  return (
    <section data-urai-studio-page="contact" className="page-stack narrow-page">
      <p className="eyebrow">Contact</p>
      <h1>Start a URAI Studio production conversation.</h1>
      <p className="hero-lede">
        Use this page for serious build requests, launch support, enterprise integrations, and connecting URAI Studio
        into the broader URAI system-of-systems.
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
            <h2>Before production activation</h2>
            <p>
              Generation, billing, private asset downloads, dashboards, and admin workflows are activated only after
              real environment variables, authentication, tenant scoping, and provider contracts are verified.
            </p>
            <Link className="button button-secondary" href="/api/system/integration-contract">
              Review Integration Contract
            </Link>
          </article>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}