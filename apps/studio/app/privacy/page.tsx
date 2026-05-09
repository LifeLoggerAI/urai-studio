import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Production-ready privacy overview for URAI Studio data, generated content, analytics, and integrations.',
  alternates: {
    canonical: '/privacy',
  },
};

const sections = [
  {
    title: 'Information we collect',
    body:
      'URAI Studio may process information you submit through public forms, including email address, name, project interest, and message content. It may also collect project metadata, prompts, generated-content metadata, usage events, diagnostics, browser metadata, error logs, anti-abuse signals, and integration configuration needed to operate and secure the service.',
  },
  {
    title: 'How we use information',
    body:
      'We use submitted information to operate the waitlist, respond to project inquiries, improve the website, monitor reliability, prevent abuse, prepare launch communications, and support URAI Studio production workflows.',
  },
  {
    title: 'Generated content',
    body:
      'Generated media and job metadata are stored only when the connected backend, storage bucket, or Asset Factory pipeline is configured. Downloads and private assets must be access-controlled before launch.',
  },
  {
    title: 'Analytics and diagnostics',
    body:
      'Operational analytics may be used to improve reliability, usage visibility, and system health. Production analytics should avoid exposing secrets or unnecessary personal data.',
  },
  {
    title: 'Service providers',
    body:
      'URAI Studio may use hosting, database, analytics, security, communications, Firebase, Stripe, generation providers, and connected URAI services to operate the website. Production deployments must document the exact providers and retention settings in the release runbook before broad launch.',
  },
  {
    title: 'Retention and deletion',
    body:
      'Waitlist and contact records should be retained only as long as needed for launch operations, support, legal compliance, and abuse prevention. To request deletion or correction, contact URAI Labs through the public contact channel on this website.',
  },
  {
    title: 'Security',
    body:
      'We use reasonable technical and organizational safeguards, including production readiness checks and restricted server-side persistence. No internet service can be guaranteed completely secure.',
  },
  {
    title: 'Children',
    body: 'URAI Studio is not directed to children under 13 and should not be used to submit children’s personal data.',
  },
  {
    title: 'Contact and review',
    body:
      'This page is a product-ready policy scaffold for legal review and should be finalized by counsel before broad commercial launch. We may update this policy as URAI Studio moves from launch preview to production service.',
  },
];

export default function PrivacyPage() {
  return (
    <section data-urai-studio-page="privacy" className="page-stack prose-page">
      <p className="eyebrow">Privacy</p>
      <h1>Privacy-first creative infrastructure.</h1>
      <p className="hero-lede">
        URAI Studio is designed to make data flows explicit, feature-gate unavailable integrations, and avoid
        pretending that unconfigured services are live. This policy describes the launch data practices for the public
        website at www.uraistudio.com.
      </p>

      <div className="grid feature-grid">
        {sections.map(({ title, body }) => (
          <article className="card" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <div className="launch-panel">
        <div>
          <h2>Need the implementation contract?</h2>
          <p>Review routes, endpoints, required environment variables, and limitations in the system contract.</p>
          <p>
            <strong>Effective date:</strong> May 8, 2026
          </p>
        </div>
        <Link className="button button-primary" href="/api/system/integration-contract">
          View Contract JSON
        </Link>
      </div>
    </section>
  );
}
