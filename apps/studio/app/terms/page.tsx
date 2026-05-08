import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Production-ready terms scaffold for URAI Studio accounts, generated content, payments, availability, and acceptable use.',
};

const sections = [
  ['Use of service', 'URAI Studio provides creative workflow surfaces, system APIs, generated media intake, asset operations, and integration contracts. Users are responsible for lawful, authorized use.'],
  ['Accounts and access', 'Protected dashboards, generation, downloads, billing, and admin operations must require real authentication and tenant scoping before production activation.'],
  ['Generated content', 'Generated assets should be governed by the active provider terms, customer agreement, and project-specific rights review. The app must not claim completed generation unless a real backend job succeeds.'],
  ['Payments', 'Creator, Studio Pro, and Enterprise billing should be enabled only after Stripe products, secure checkout, billing portal, and webhook signature verification are configured.'],
  ['Availability', 'System health, status, and known limitations are exposed so customers can understand configured capabilities and unavailable services.'],
  ['Acceptable use', 'Users may not use URAI Studio for unlawful, abusive, infringing, deceptive, or harmful workflows. Enterprise deployments may require additional review.'],
];

export default function TermsPage() {
  return (
    <section data-urai-studio-page="terms" className="page-stack">
      <p className="eyebrow">Terms</p>
      <h1>Clear terms for a production creative system.</h1>
      <p className="hero-lede">This terms page is a launch-ready legal scaffold for review, written to avoid unsupported claims about live generation, billing, auth, or integrations.</p>
      <div className="grid">
        {sections.map(([title, body]) => <article className="card" key={title}><h2>{title}</h2><p>{body}</p></article>)}
      </div>
      <div className="launch-panel"><div><h2>Questions about production use?</h2><p>Contact URAI Labs before enabling commercial workflows, payments, or private generated asset downloads.</p></div><Link className="button button-primary" href="/contact">Contact URAI Labs</Link></div>
    </section>
  );
}
