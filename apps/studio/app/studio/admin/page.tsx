import type { Metadata } from 'next';
import Link from 'next/link';

import { StudioActionPanel } from '@/components/studio/StudioActionPanel';

export const metadata: Metadata = {
  title: 'Studio Admin QA',
  description: 'URAI Studio admin and QA panel for callable, Firebase, export, and smoke-test verification.',
  alternates: { canonical: '/studio/admin' },
};

const checks = [
  'Ping callable function',
  'Seed demo project',
  'Create project',
  'Create asset job',
  'Generate narrator script',
  'Create export job',
  'Process export job',
  'Load Studio dashboard summary',
];

function adminQaEnabled() {
  return process.env.NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED === 'true' || process.env.STUDIO_ADMIN_QA_ENABLED === 'true';
}

export default function StudioAdminPage() {
  if (!adminQaEnabled()) {
    return (
      <section data-urai-studio-page="studio-admin-gated" className="page-stack">
        <p className="eyebrow">Admin QA gated</p>
        <h1>Studio verification panel is disabled for public demo mode.</h1>
        <p className="hero-lede">
          The operator QA surface is intentionally hidden unless Studio admin QA is enabled in the deployment environment.
          Public visitors can still review the Studio system map, privacy posture, and safe module diagnostics.
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
    <section data-urai-studio-page="studio-admin" className="page-stack">
      <p className="eyebrow">Admin QA</p>
      <h1>Studio verification panel</h1>
      <p className="hero-lede">
        A focused QA surface for validating that URAI Studio callables, Firebase Auth, Firestore writes, and export contracts are connected.
      </p>

      <div className="grid">
        {checks.map((check) => (
          <article className="card" key={check}>
            <p className="eyebrow">QA check</p>
            <h2>{check}</h2>
            <p>Run from the callable action panel below and verify the response payload.</p>
          </article>
        ))}
      </div>

      <StudioActionPanel />

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Local enforcement</p>
          <h2>Required command path</h2>
          <p>Before release lock, run the repo command sequence documented in TESTING.md and FINAL_AUDIT_REPORT.md.</p>
        </div>
        <pre className="card code-block">pnpm install{`\n`}pnpm lint{`\n`}pnpm typecheck{`\n`}pnpm test{`\n`}pnpm build{`\n`}pnpm --dir functions build{`\n`}pnpm studio:smoke</pre>
      </section>

      <div className="cta-row">
        <Link className="button button-secondary" href="/studio/projects">Open projects</Link>
        <Link className="button button-secondary" href="/studio/exports">Open exports</Link>
      </div>
    </section>
  );
}
