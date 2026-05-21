import Link from 'next/link';

import { proofPoints, uraiSystemNodes, type UraiSystemNode } from '@/lib/studio/system-of-systems';

const statusLabels: Record<UraiSystemNode['status'], string> = {
  live: 'Live',
  demo: 'Demo',
  internal: 'Internal',
  prototype: 'Prototype',
  planned: 'Planned',
  fallback: 'Fallback',
  operational: 'Operational',
  limited: 'Limited',
  degraded: 'Degraded',
};

export function SystemOfSystemsMap({ compact = false }: { compact?: boolean }) {
  const center = uraiSystemNodes.find((node) => node.id === 'studio');
  const orbitNodes = uraiSystemNodes.filter((node) => node.id !== 'studio');

  return (
    <section className="system-map-panel" aria-labelledby="system-map-heading">
      <div className="section-heading">
        <p className="eyebrow">System of systems</p>
        <h2 id="system-map-heading">One studio spine. Every URAI system connected.</h2>
        <p>
          URAI Studio is the creative command layer for Asset Factory, Motion, Cinema, Music, Visuals,
          Spatial, Privacy, Admin, Foundation, and Labs — a front door into the broader URAI emotional and cinematic operating system.
        </p>
      </div>

      <div className="proof-strip system-proof" aria-label="Launch proof points">
        {proofPoints.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </div>

      <div className="system-map-grid">
        {center ? (
          <article className="card system-center-card">
            <p className="eyebrow">Creative command layer</p>
            <h3>{center.title}</h3>
            <span className={`badge badge-${center.status}`}>{statusLabels[center.status]}</span>
            <p>{center.description}</p>
            <div className="mini-meta">
              <strong>Inputs</strong>
              <span>{center.inputs.join(' · ')}</span>
              <strong>Outputs</strong>
              <span>{center.outputs.join(' · ')}</span>
            </div>
            <Link className="button button-primary" href={center.route}>{center.ctaLabel}</Link>
          </article>
        ) : null}

        <div className="system-orbit-grid">
          {orbitNodes.slice(0, compact ? 8 : orbitNodes.length).map((node) => (
            <article key={node.id} className="card system-node-card">
              <div className="module-card-header">
                <h3>{node.title}</h3>
                <span className={`badge badge-${node.status}`}>{statusLabels[node.status]}</span>
              </div>
              <p>{node.description}</p>
              {!compact ? (
                <div className="mini-meta">
                  <strong>Inputs</strong>
                  <span>{node.inputs.slice(0, 3).join(' · ')}</span>
                  <strong>Outputs</strong>
                  <span>{node.outputs.slice(0, 3).join(' · ')}</span>
                </div>
              ) : null}
              <Link className="text-link" href={node.route}>{node.ctaLabel}</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
