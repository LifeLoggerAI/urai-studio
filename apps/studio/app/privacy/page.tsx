import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Production-ready privacy overview for URAI Studio data, generated content, analytics, and integrations.',
};

const sections = [
  ['Data collected', 'URAI Studio may process account details, contact requests, project metadata, prompts, generated-content metadata, usage events, diagnostics, and integration configuration needed to operate the service.'],
  ['Generated content', 'Generated media and job metadata are stored only when the connected backend, storage bucket, or Asset Factory pipeline is configured. Downloads and private assets must be access-controlled before launch.'],
  ['Analytics and diagnostics', 'Operational analytics may be used to improve reliability, usage visibility, and system health. Production analytics should avoid exposing secrets or unnecessary personal data.'],
  ['Third-party services', 'Firebase, Stripe, generation providers, and connected URAI services should be documented in environment and deployment files before being enabled in production.'],
  ['Contact and review', 'This page is a product-ready policy scaffold for legal review and should be finalized by counsel before broad commercial launch.'],
];

export default function PrivacyPage() {
  return (
    <section data-urai-studio-page="privacy" className="page-stack">
      <p className="eyebrow">Privacy</p>
      <h1>Privacy-first creative infrastructure.</h1>
      <p className="hero-lede">URAI Studio is designed to make data flows explicit, feature-gate unavailable integrations, and avoid pretending that unconfigured services are live.</p>
      <div className="grid">
        {sections.map(([title, body]) => <article className="card" key={title}><h2>{title}</h2><p>{body}</p></article>)}
      </div>
      <div className="launch-panel"><div><h2>Need the implementation contract?</h2><p>Review routes, endpoints, required environment variables, and limitations in the system contract.</p></div><Link className="button button-primary" href="/api/system/integration-contract">View Contract JSON</Link></div>
    </section>
  );
}
