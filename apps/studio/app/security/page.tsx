import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Report security issues affecting URAI Studio and review its public/protected surface boundary.',
  alternates: { canonical: '/security' },
};

export default function SecurityPage() {
  return (
    <section data-urai-studio-page="security" className="page-stack prose-page">
      <p className="eyebrow">Security</p>
      <h1>Report vulnerabilities without exposing secrets.</h1>
      <p className="hero-lede">
        URAI Studio separates public creative pages from authenticated generation, asset, job, billing, and administrative surfaces.
      </p>
      <div className="grid feature-grid">
        <article className="card"><h2>Security reports</h2><p>Email <a href="mailto:security@urailabs.com">security@urailabs.com</a> for vulnerabilities, authorization failures, exposed credentials, or suspected data exposure.</p></article>
        <article className="card"><h2>Do not send secrets</h2><p>Do not email passwords, session cookies, API keys, private keys, provider credentials, recovery codes, or private client assets.</p></article>
        <article className="card"><h2>Protected operations</h2><p>Generation, private assets, job operations, billing, dashboards, and administrative controls require their own authentication and authorization boundaries before production activation.</p></article>
      </div>
    </section>
  );
}
