import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'URAI Studio admin route for operational diagnostics, controls, and guarded system configuration state.',
  alternates: {
    canonical: '/admin',
  },
};

function adminQaEnabled() {
  return process.env.NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED === 'true' || process.env.STUDIO_ADMIN_QA_ENABLED === 'true';
}

export default function Page() {
  if (!adminQaEnabled()) {
    return (
      <section data-urai-studio-page="admin-gated" className="page-stack">
        <p className="eyebrow">Admin gated</p>
        <h1>Admin controls are disabled for public demo mode.</h1>
        <p className="hero-lede">
          URAI Studio keeps public module status visible while operator controls and QA actions stay hidden unless explicitly enabled in the deployment environment.
        </p>
        <div className="cta-row">
          <Link className="button button-primary" href="/studio">Open Studio overview</Link>
          <Link className="button button-secondary" href="/status">View public status</Link>
          <Link className="button button-secondary" href="/privacy">Read privacy</Link>
        </div>
      </section>
    );
  }

  return (
    <section data-urai-studio-page="admin" className="page-stack">
      <p className="eyebrow">Admin enabled</p>
      <h1>Admin controls</h1>
      <p className="hero-lede">Admin controls are enabled for this deployment environment.</p>
      <div className="cta-row">
        <Link className="button button-primary" href="/studio/admin">Open Studio QA panel</Link>
        <Link className="button button-secondary" href="/status">View status</Link>
      </div>
    </section>
  );
}
