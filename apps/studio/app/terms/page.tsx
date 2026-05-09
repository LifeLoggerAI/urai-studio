import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'Production-ready terms scaffold for URAI Studio accounts, generated content, payments, availability, and acceptable use.',
};

const sections = [
  {
    title: 'Use of the website and service',
    body:
      'You may use URAI Studio to learn about the studio, join the waitlist, request contact, review public product materials, and use configured creative workflow surfaces, system APIs, generated media intake, asset operations, and integration contracts. Users are responsible for lawful, authorized use and may not misuse the website, interfere with its operation, attempt unauthorized access, submit malicious content, or use forms for spam or abuse.',
  },
  {
    title: 'Preview status',
    body:
      'URAI Studio features, demos, pricing, integrations, generated-media workflows, dashboards, and availability may change before public release. Public pages should not be treated as a guaranteed service commitment unless separately agreed in writing.',
  },
  {
    title: 'Submitted information',
    body:
      'You are responsible for the accuracy and legality of information you submit. Do not submit confidential, regulated, or sensitive production data through public preview forms unless URAI Labs has explicitly approved that workflow.',
  },
  {
    title: 'Accounts and access',
    body:
      'Protected dashboards, generation, downloads, billing, assets, job workflows, and admin operations must require real authentication and tenant scoping before production activation. Credentials, API keys, and private links should be kept secure and shared only with authorized collaborators.',
  },
  {
    title: 'Generated content',
    body:
      'Generated outputs may depend on prompts, source materials, third-party services, configured production pipelines, active provider terms, customer agreements, and project-specific rights review. The app must not claim completed generation unless a real backend job succeeds. Enterprise agreements may define ownership, review, and usage rights in more detail.',
  },
  {
    title: 'Payments',
    body:
      'Creator, Studio Pro, and Enterprise billing should be enabled only after Stripe products, secure checkout, billing portal, and webhook signature verification are configured.',
  },
  {
    title: 'Intellectual property',
    body:
      'The URAI Studio website, branding, designs, copy, code, and product materials are owned by URAI Labs LLC or its licensors. These terms do not grant rights to copy, redistribute, or reverse engineer the service.',
  },
  {
    title: 'Availability',
    body:
      'System health endpoints describe current service posture without guaranteeing uninterrupted availability. Status and known limitations are exposed so customers can understand configured capabilities and unavailable services. Production SLAs, if any, should be documented in a separate written agreement.',
  },
  {
    title: 'Acceptable use',
    body:
      'Users may not use URAI Studio for unlawful, abusive, infringing, deceptive, or harmful workflows. Enterprise deployments may require additional review.',
  },
  {
    title: 'Disclaimers',
    body:
      'The website is provided as-is during launch preparation. URAI Labs disclaims warranties to the maximum extent permitted by law and does not guarantee uninterrupted or error-free operation.',
  },
];

export default function TermsPage() {
  return (
    <section data-urai-studio-page="terms" className="page-stack prose-page">
      <p className="eyebrow">Terms</p>
      <h1>URAI Studio Terms of Service</h1>

      <p className="hero-lede">
        These launch terms apply to the public URAI Studio website at www.uraistudio.com. They are intended to
        support waitlist, project inquiry, preview, demonstration use, and production creative system planning before
        broader commercial availability. These terms are a launch-ready legal scaffold for review, written to avoid
        unsupported claims about live generation, billing, auth, or integrations.
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
          <h2>Questions about production use?</h2>
          <p>
            Contact URAI Labs before enabling commercial workflows, payments, private generated asset downloads, or
            enterprise integrations.
          </p>
          <p>
            <strong>Effective date:</strong> May 8, 2026
          </p>
        </div>
        <Link className="button button-primary" href="/contact">
          Contact URAI Labs
        </Link>
      </div>
    </section>
  );
}