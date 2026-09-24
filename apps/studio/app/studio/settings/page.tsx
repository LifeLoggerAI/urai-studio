import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Studio Settings',
  description: 'URAI Studio settings surface for Firebase configuration, feature flags, storage contracts, and release-lock status.',
  alternates: { canonical: '/studio/settings' },
};

const settings = [
  {
    title: 'Firebase client config',
    body: 'Set NEXT_PUBLIC_FIREBASE_* values to enable browser callables, anonymous auth, and dashboard reads where the release contract permits them.',
  },
  {
    title: 'Server identity',
    body: 'Use Google Application Default Credentials or protected GitHub OIDC + Workload Identity Federation. Long-lived Firebase private keys and service-account JSON are not Studio runtime or deployment authority.',
  },
  {
    title: 'Feature flags',
    body: 'Execution is governed by the server-owned feature policy. Legacy StudioFeatureFlags are display compatibility only and cannot authorize activation.',
  },
  {
    title: 'Release lock',
    body: 'Exact-head CI, required independent review, provider identity, migration evidence, deployment readback, monitoring/recovery, and distinct rollback evidence must all close before production completion is claimed.',
  },
];

export default function StudioSettingsPage() {
  return (
    <section data-urai-studio-page="studio-settings" className="page-stack">
      <p className="eyebrow">Studio settings</p>
      <h1>Configuration and release controls</h1>
      <p className="hero-lede">
        URAI Studio settings document the exact environment and release gates required before the system can be called verified.
      </p>

      <div className="grid">
        {settings.map((setting) => (
          <article className="card" key={setting.title}>
            <p className="eyebrow">Configuration</p>
            <h2>{setting.title}</h2>
            <p>{setting.body}</p>
          </article>
        ))}
      </div>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Required files</p>
          <h2>Enforcement artifacts</h2>
          <p>These files must remain accurate and current as implementation changes.</p>
        </div>
        <pre className="card code-block">README.md{`\n`}SYSTEM_MAP.md{`\n`}AUDIT_REPORT.md{`\n`}FIREBASE.md{`\n`}TESTING.md{`\n`}HANDOFF.md{`\n`}RELEASE_NOTES.md{`\n`}FINAL_AUDIT_REPORT.md{`\n`}.env.example{`\n`}firestore.rules{`\n`}storage.rules{`\n`}firestore.indexes.json{`\n`}scripts/studio-smoke-test.js</pre>
      </section>

      <div className="cta-row">
        <Link className="button button-secondary" href="/studio/admin">Open admin QA</Link>
        <Link className="button button-secondary" href="/studio">Back to Studio</Link>
      </div>
    </section>
  );
}
